import crypto from "crypto";
import { prisma } from "../config/prismaClient.js";
import razorpay from "../config/razorpay.js";
import { createOrderSchema, verifyPaymentSchema } from "../validations/payment.validations.js";

// ---------- Signature check ----------
// Razorpay jab payment karwata hai to ek "signature" bhejta hai. Wo HMAC-SHA256 hota hai
// (data + hamara secret key). Hum wahi signature khud banate hain, agar dono same nikle
// to data asli hai, kisi ne beech me fake nahi kiya. Secret sirf hamare aur Razorpay ke paas hai.
// timingSafeEqual = compare karte waqt time barabar rakhta hai, taaki attacker time naap ke guess na kare.
const isValidSignature = (data, signature, secret) => {
  const expected = crypto.createHmac("sha256", secret).update(data).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// ---------- Booking confirm karna (verify aur webhook dono yahi use karte hain) ----------
// Idempotent: kitni baar bhi chalao, result same, kuch bigadta nahi
const confirmPayment = async (orderId, paymentId) => {
  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId: orderId },
    include: { booking: { include: { trip: { include: { bus: { include: { operator: true } } } } } } },
  });
  if (!payment) return { ok: false, code: 404, message: "Payment not found" };

  // pehle se PAID hai (verify aur webhook dono aaye) to dobara kaam nahi
  if (payment.status === "PAID") return { ok: true, booking: payment.booking, already: true };

  const booking = payment.booking;
  // booking expire/cancel ho chuki hai to confirm nahi (refund baad me banayenge)
  if (booking.status !== "PENDING") {
    console.warn(`Payment ${paymentId} came for ${booking.status} booking ${booking.id}. Refund needed`);
    return { ok: false, code: 409, message: `Booking is ${booking.status}. Amount will be refunded` };
  }

  // commission snapshot: us waqt ka operator percentage booking pe save kar lete hain
  // (baad me operator ka % badle to purani bookings ka hisaab na bigde)
  const pct = booking.trip.bus.operator.commissionPct;
  const commissionAmount = Math.round((booking.totalAmount * pct) / 100);
  const operatorAmount = booking.totalAmount - commissionAmount;

  // transaction: payment aur booking ek saath update (ya dono hote hain ya koi nahi)
  const updatedBooking = await prisma.$transaction(async (tx) => {
    // where me status PENDING: agar expiry job ne isi waqt EXPIRED kar diya to count 0 aayega
    const changed = await tx.booking.updateMany({
      where: { id: booking.id, status: "PENDING" },
      data: { status: "CONFIRMED", commissionPct: pct, commissionAmount, operatorAmount },
    });
    if (changed.count === 0) return null; // kisi aur ne pehle badal diya

    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "PAID", razorpayPaymentId: paymentId },
    });
    return tx.booking.findUnique({ where: { id: booking.id } });
  });

  // booking expire ho chuki thi aur payment aa gayi (refund wale step me handle karenge)
  if (!updatedBooking) {
    console.warn(`Payment ${paymentId} came but booking ${booking.id} is no longer PENDING. Refund needed`);
    return { ok: false, code: 409, message: "Booking expired. Amount will be refunded" };
  }
  return { ok: true, booking: updatedBooking };
};

// ---------- POST /api/payments/create-order ----------
export const createOrder = async (req, res) => {
  try {
    const result = createOrderSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }
    const { bookingId } = result.data;

    // Idempotency-Key: frontend har payment attempt pe ek unique key bhejta hai
    const idempotencyKey = req.headers["idempotency-key"];
    if (!idempotencyKey) {
      return res.status(400).json({ message: "Idempotency-Key header is required" });
    }
    // user ki id saath jodte hain, taaki do users ki same key takra na jaye
    const fullKey = `${req.user.id}:${idempotencyKey}`;

    // 1) ye key pehle use hui hai? to naya order mat banao, purana wahi wapas do
    const sameKey = await prisma.payment.findUnique({ where: { idempotencyKey: fullKey } });
    if (sameKey) {
      // wahi key kisi aur booking ke liye use ho rahi hai to galti hai
      if (sameKey.bookingId !== bookingId) {
        return res.status(422).json({ message: "Idempotency-Key already used for another booking" });
      }
      return res.status(200).json({
        message: "Order already created",
        order: { id: sameKey.razorpayOrderId, amount: sameKey.amount * 100, currency: "INR" },
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    }

    // 2) sirf apni PENDING booking ka order ban sakta hai
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, userId: req.user.id },
    });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status !== "PENDING") {
      return res.status(409).json({ message: `Booking is already ${booking.status}` });
    }
    if (booking.expiresAt <= new Date()) {
      return res.status(410).json({ message: "Booking expired. Please book again" });
    }

    // 3) is booking ka order pehle se bana hai (alag key se) to wahi do, dusra order nahi
    const existing = await prisma.payment.findFirst({
      where: { bookingId, status: "CREATED" },
    });
    if (existing) {
      return res.status(200).json({
        message: "Order already created",
        order: { id: existing.razorpayOrderId, amount: existing.amount * 100, currency: "INR" },
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    }

    // razorpay.orders.create() = Razorpay ke server pe "order" banata hai.
    // Order matlab: "is amount ka payment aane wala hai". Isse hume order_id (order_xxx) milta hai,
    // jisse frontend checkout popup kholta hai.
    //   amount   : PAISE me hota hai (rupees * 100), integer
    //   currency : "INR"
    //   receipt  : hamari apni reference (booking id), max 40 characters
    //   notes    : extra info (key-value), dashboard me dikhti hai
    const order = await razorpay.orders.create({
      amount: booking.totalAmount * 100,
      currency: "INR",
      receipt: booking.id,
      notes: { bookingId: booking.id },
    });

    // hamare DB me payment row (amount rupees me)
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        razorpayOrderId: order.id,
        idempotencyKey: fullKey,
        amount: booking.totalAmount,
      },
    });

    return res.status(201).json({
      message: "Order created",
      order: { id: order.id, amount: order.amount, currency: order.currency },
      keyId: process.env.RAZORPAY_KEY_ID, // checkout ke liye, ye public hai (secret nahi)
    });
  } catch (error) {
    // do request bilkul ek saath aayi aur dono ne key save karni chahi
    if (error.code === "P2002") {
      return res.status(409).json({ message: "Duplicate request" });
    }
    // Razorpay ke errors alag shape ke hote hain: error.error.description me asli wajah hoti hai
    console.error("createOrder error:", error?.error?.description || error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ---------- POST /api/payments/verify ----------
// Frontend ko payment ke baad Razorpay se 3 cheezein milti hain, wo yahan aati hain
export const verifyPayment = async (req, res) => {
  try {
    const result = verifyPaymentSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = result.data;

    // Razorpay ka signature = HMAC-SHA256( "order_id|payment_id" , KEY_SECRET )
    // hum wahi banake compare karte hain
    const valid = isValidSignature(
      `${razorpay_order_id}|${razorpay_payment_id}`,
      razorpay_signature,
      process.env.RAZORPAY_KEY_SECRET
    );
    if (!valid) return res.status(400).json({ message: "Invalid payment signature" });

    // ye order isi logged-in user ka hona chahiye (dusre ka order confirm na kar paye)
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: razorpay_order_id },
      include: { booking: true },
    });
    if (!payment || payment.booking.userId !== req.user.id) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const out = await confirmPayment(razorpay_order_id, razorpay_payment_id);
    if (!out.ok) return res.status(out.code).json({ message: out.message });

    return res.status(200).json({ message: "Payment successful. Booking confirmed", booking: out.booking });
  } catch (error) {
    console.error("verifyPayment error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ---------- POST /api/payments/webhook (Razorpay khud call karta hai) ----------
// Webhook = Razorpay ka server hamare server ko batata hai "is order ka payment ho gaya".
// Ye backup hai: user pay karke browser band kar de, tab bhi booking confirm ho jati hai.
// NOTE: yaha req.body Buffer hota hai (express.raw), JSON nahi, kyunki signature raw text pe banta hai
export const razorpayWebhook = async (req, res) => {
  try {
    // agar index.js me express.raw ki jagah json laga hai to yahan clear message mile
    if (!Buffer.isBuffer(req.body)) {
      console.error("Webhook body is not raw. Put the webhook route above express.json() in index.js");
      return res.status(500).json({ message: "Webhook misconfigured" });
    }

    const signature = req.headers["x-razorpay-signature"];
    const raw = req.body.toString("utf8");

    // webhook ka secret alag hota hai (dashboard me webhook banate waqt hum khud likhte hain)
    if (!signature || !isValidSignature(raw, signature, process.env.RAZORPAY_WEBHOOK_SECRET)) {
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    const event = JSON.parse(raw);

    // payment.captured / order.paid = paisa aa gaya, booking confirm karo
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const p = event.payload.payment.entity;
      await confirmPayment(p.order_id, p.id);
    }

    // payment.failed: sirf log karte hain. Razorpay me ek hi order pe user dobara try kar sakta hai,
    // isliye payment ko FAILED mark nahi karte (warna retry pe naya order banega aur double charge ka risk)
    if (event.event === "payment.failed") {
      const p = event.payload.payment.entity;
      console.log(`Payment attempt failed for order ${p.order_id}`);
    }

    // Razorpay ko hamesha 200 chahiye, warna wo baar baar retry karta hai
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("webhook error:", error);
    // 500 dene se Razorpay baad me dobara try karega (ye hum chahte hain)
    return res.status(500).json({ message: "Webhook error" });
  }
};