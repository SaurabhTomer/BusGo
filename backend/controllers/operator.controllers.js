import bcrypt from "bcrypt"; 
import {prisma} from "../config/prismaClient.js";
import redis from "../config/redis.js"; 
import { verifiedKey } from "../constants/auth.constants.js"; 
import { issueTokens } from "../utils/issueTokens.js";
import { operatorSignupSchema, bookingsQuerySchema } from "../validations/operator.validations.js"; 

// ----------  OPERATOR SIGNUP: POST /operators/signup ----------
export const operatorSignup = async (req, res) => {
  try {
    const result = operatorSignupSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }
    const { name, email, phone, password, agencyName, gstNo, contactPhone, address } =
      result.data;

    const isVerified = await redis.get(verifiedKey(phone));
    if (!isVerified) {
      return res.status(403).json({ message: "Please verify your phone first" });
    }

    const [emailExists, phoneExists, gstExists] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.user.findUnique({ where: { phone } }),
      prisma.operator.findUnique({ where: { gstNo } }),
    ]);
    if (emailExists) {
      return res.status(409).json({ message: "Email already registered" });
    }
    if (phoneExists) {
      return res.status(409).json({ message: "Phone already registered" });
    }
    if (gstExists) {
      return res.status(409).json({ message: "This GST number is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // user aur operator profile EK SAATH banao (ya dono banenge ya dono nahi)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: "OPERATOR", 
        operator: {
          create: { agencyName, gstNo, contactPhone, address },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        operator: true,
      },
    });

   
    await redis.del(verifiedKey(phone));

   
    const token = await issueTokens(user, res);

    return res.status(201).json({
      message: "Operator account created. Your application is under review",
      token,
      user,
    });
  } catch (error) {
    // P2002 = do log ek saath signup kare to yaha aayega
    if (error.code === "P2002") {
      return res.status(409).json({ message: "Email, phone or GST number already registered" });
    }
    console.error("operatorSignup error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ----------  MY PROFILE: GET /operators/me ----------
export const getMyOperator = async (req, res) => {
  try {
    const operator = await prisma.operator.findUnique({ where: { userId: req.user.id } });
    if (!operator) {
      return res.status(404).json({ message: "Operator profile not found" });
    }
    return res.status(200).json({ operator });
  } catch (error) {
    console.error("getMyOperator error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};



// ---------- chhote helpers ----------
// booking ke saath ye relations lane padte hain
const bookingInclude = {
  user: { select: { name: true } },
  seats: { select: { seat: { select: { seatNumber: true } } } },
  trip: {
    select: {
      departureTime: true,
      route: {
        select: {
          sourceCity: { select: { name: true } },
          destinationCity: { select: { name: true } },
        },
      },
    },
  },
};
const routeLabel = (route) => `${route.sourceCity.name} to ${route.destinationCity.name}`; // "Lucknow to Delhi"
const dayOf = (date) => new Date(date).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD
const ofOperator = (operatorId) => ({ trip: { route: { operatorId } } }); // is operator ki bookings
const myOperator = (req) => prisma.operator.findUnique({ where: { userId: req.user.id } });

// ---------- GET /api/operators/me/stats ----------
export const getMyStats = async (req, res) => {
  try {
    const operator = await myOperator(req);
    if (!operator) return res.status(404).json({ message: "Operator profile not found" });

    const where = { ...ofOperator(operator.id), status: "CONFIRMED" };
    const [bookings, money] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.aggregate({ where, _sum: { operatorAmount: true } }),
    ]);
    return res.status(200).json({ bookings, revenue: money._sum.operatorAmount ?? 0 });
  } catch (error) {
    console.error("getMyStats error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ---------- GET /api/operators/me/bookings  (?status=CONFIRMED) ----------
export const getMyBookings = async (req, res) => {
  try {
    const result = bookingsQuerySchema.safeParse(req.query);
    if (!result.success) return res.status(400).json({ message: result.error.issues[0].message });

    const operator = await myOperator(req);
    if (!operator) return res.status(404).json({ message: "Operator profile not found" });

    const rows = await prisma.booking.findMany({
      where: { ...ofOperator(operator.id), ...(result.data.status && { status: result.data.status }) },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: bookingInclude,
    });

    const bookings = rows.map((b) => ({
      id: b.id,
      passenger: b.user.name,
      route: routeLabel(b.trip.route),
      date: dayOf(b.trip.departureTime),
      seats: b.seats.map((s) => s.seat.seatNumber).join(", "),
      amount: b.totalAmount,
      status: b.status,
    }));
    return res.status(200).json({ count: bookings.length, bookings });
  } catch (error) {
    console.error("getMyBookings error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ---------- GET /api/operators/me/earnings ----------
// gross = customer ne diya, commission = hamara hissa, net = operator ko milega
export const getMyEarnings = async (req, res) => {
  try {
    const operator = await myOperator(req);
    if (!operator) return res.status(404).json({ message: "Operator profile not found" });

    const rows = await prisma.booking.findMany({
      where: { ...ofOperator(operator.id), status: "CONFIRMED" },
      include: bookingInclude,
    });

    let gross = 0;
    let commission = 0;
    let net = 0;
    const byTrip = new Map(); // trip ke hisaab se jodne ke liye

    for (const b of rows) {
      gross += b.totalAmount;
      commission += b.commissionAmount ?? 0;
      net += b.operatorAmount ?? 0;

      const t = byTrip.get(b.tripId) ?? { id: b.tripId, route: routeLabel(b.trip.route), date: dayOf(b.trip.departureTime), seats: 0, gross: 0 };
      t.seats += b.seats.length;
      t.gross += b.totalAmount;
      byTrip.set(b.tripId, t);
    }

    const trips = [...byTrip.values()].sort((a, b) => (a.date < b.date ? 1 : -1)); // nayi trip pehle
    return res.status(200).json({ gross, commission, net, trips });
  } catch (error) {
    console.error("getMyEarnings error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ---------- POST /api/operators/me/reapply ----------
// REJECTED operator dobara review ke liye bheje (PAN aur GST dono honi chahiye)
export const reapply = async (req, res) => {
  try {
    const operator = await myOperator(req);
    if (!operator) return res.status(404).json({ message: "Operator profile not found" });
    if (operator.status !== "REJECTED") {
      return res.status(400).json({ message: "Only a rejected application can be sent again" });
    }

    const docs = await prisma.operatorDocument.findMany({
      where: { operatorId: operator.id, type: { in: ["PAN", "GST"] } },
      select: { type: true },
    });
    if (docs.length < 2) {
      return res.status(400).json({ message: "Upload both PAN and GST before applying again" });
    }

    await prisma.operator.update({
      where: { id: operator.id },
      data: { status: "PENDING", rejectionReason: null }, // purani wajah hata do
    });
    return res.status(200).json({ message: "Application sent for review again" });
  } catch (error) {
    console.error("reapply error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};