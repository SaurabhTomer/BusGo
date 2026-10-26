import { prisma } from "../config/prismaClient.js";
import razorpay from "../config/razorpay.js";

// ---------- Refund  % milega  ----------
export const getRefundPercent = (departureTime) => {
  
  const hoursLeft = (new Date(departureTime).getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursLeft > 24) return 90; 
  if (hoursLeft > 12) return 50; 
  return 0;
};


// ---------- Refund bhejna ----------
// payment = Payment row (PAID, razorpayPaymentId bhara hua)
// amount  = rupees me (kitna wapas dena hai)
// reason  = text, kyun refund hua
// Ye kabhi error throw nahi karta. Fail hua to Refund row "FAILED" rehti hai.

export const refundPayment = async (payment, amount, reason) => {
  // 1) pehle DB me Refund row (PENDING), taaki record rahe chahe aage kuch bhi ho
  const refund = await prisma.refund.create({
    data: { paymentId: payment.id, amount, reason },
  });

  try {
    let razorpayRefundId;

    if (process.env.MOCK_REFUND === "true") {
      // TESTING: Razorpay call skip. Humari fake payment_id (signPayment.js wali)
      // Razorpay ke paas hoti hi nahi, isliye asli refund fail hota. Production me ye false rakho.
      razorpayRefundId = `rfnd_mock_${refund.id.slice(0, 8)}`;
    } else {
      // razorpay.payments.refund(paymentId, {...}) = us payment ka paisa wapas bhejta hai
      //   amount  : PAISE me (rupees * 100). Poora ya aadha, dono chalta hai
      //   receipt : hamari reference (refund row ki id)
      //   notes   : extra info (dashboard me dikhti hai)
      const r = await razorpay.payments.refund(payment.razorpayPaymentId, {
        amount: amount * 100,
        receipt: refund.id,
        notes: { reason },
      });
      razorpayRefundId = r.id; // "rfnd_xxx"
    }

    // 2) sab sahi gaya: Refund PROCESSED aur Payment REFUNDED (ek saath)
    await prisma.$transaction([
      prisma.refund.update({
        where: { id: refund.id },
        data: { status: "PROCESSED", razorpayRefundId },
      }),
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: "REFUNDED" },
      }),
    ]);
    return { ok: true, refundId: refund.id, status: "PROCESSED", amount };
  } catch (error) {
    // Razorpay fail hua: Refund row FAILED, baad me retry (queue wale step me)
    console.error("Refund failed:", error?.error?.description || error);
    await prisma.refund.update({ where: { id: refund.id }, data: { status: "FAILED" } });
    return { ok: false, refundId: refund.id, status: "FAILED", amount };
  }
};