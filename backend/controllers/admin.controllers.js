import { prisma } from "../config/prismaClient.js";

import {
  idParamSchema,
  listQuerySchema,
  rejectSchema,
  bookingsQuerySchema,
  usersQuerySchema,
} from "../validations/admin.validations.js";


const userSelect = { id: true, name: true, email: true, phone: true };

// ---------- GET /api/admin/operators  (?status=PENDING) ----------
export const getOperators = async (req, res) => {
  try {
    const result = listQuerySchema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }
    const { status } = result.data;

    const operators = await prisma.operator.findMany({
      where: status ? { status } : {}, 
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: userSelect },
        _count: { select: { buses: true, documents: true } }, // kitni buses aur documents
      },
    });
    return res.status(200).json({ count: operators.length, operators });
  } catch (error) {
    console.error("getOperators error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ---------- GET /api/admin/operators/:id ----------
export const getOperatorById = async (req, res) => {
  try {
    const result = idParamSchema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }

    const operator = await prisma.operator.findUnique({
      where: { id: result.data.id },
      include: {
        user: { select: userSelect },
        buses: { select: { id: true, name: true, busNumber: true, type: true, totalSeats: true, isActive: true } },
        documents: { select: { id: true, type: true, busId: true, format: true, updatedAt: true } },
      },
    });
    if (!operator) return res.status(404).json({ message: "Operator not found" });

    return res.status(200).json({ operator });
  } catch (error) {
    console.error("getOperatorById error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ---------- PATCH /api/admin/operators/:id/approve ----------
export const approveOperator = async (req, res) => {
  try {
    const result = idParamSchema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }
    const id = result.data.id;

    const operator = await prisma.operator.findUnique({ where: { id } });
    if (!operator) return res.status(404).json({ message: "Operator not found" });

    if (operator.status === "APPROVED") {
      return res.status(409).json({ message: "Operator is already approved" });
    }

    // PAN aur GST dono upload hue hone chahiye.
    // Ye check sirf naye operator (PENDING / REJECTED) pe lagta hai.
    // SUSPENDED ko wapas chalu karne me documents dobara nahi maangte.
    if (operator.status === "PENDING" || operator.status === "REJECTED") {
      const docs = await prisma.operatorDocument.findMany({
        where: { operatorId: id, type: { in: ["PAN", "GST"] } },
        select: { type: true },
      });
      const uploaded = docs.map((d) => d.type);
      if (!uploaded.includes("PAN") || !uploaded.includes("GST")) {
        return res.status(400).json({ message: "Operator must upload both PAN and GST documents before approval" });
      }
    }

    // where me id aur purana status: do admin ek saath click kare to bhi ek hi jeete
    const changed = await prisma.operator.updateMany({
      where: { id, status: operator.status },
      data: { status: "APPROVED", rejectionReason: null }, 
    });
    if (changed.count === 0) {
      return res.status(409).json({ message: "Operator status just changed. Please try again" });
    }

    return res.status(200).json({ message: "Operator approved" });
  } catch (error) {
    console.error("approveOperator error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ---------- PATCH /api/admin/operators/:id/reject  { reason } ----------
export const rejectOperator = async (req, res) => {
  try {
    const params = idParamSchema.safeParse(req.params);
    if (!params.success) {
      return res.status(400).json({ message: params.error.issues[0].message });
    }
    const body = rejectSchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ message: body.error.issues[0].message });
    }
    const id = params.data.id;

    const operator = await prisma.operator.findUnique({ where: { id } });
    if (!operator) return res.status(404).json({ message: "Operator not found" });

    // sirf PENDING ko reject kar sakte hain (approved ko band karna ho to suspend)
    if (operator.status !== "PENDING") {
      return res.status(409).json({ message: `Only PENDING operators can be rejected (current: ${operator.status})` });
    }

    await prisma.operator.update({
      where: { id },
      data: { status: "REJECTED", rejectionReason: body.data.reason },
    });
    return res.status(200).json({ message: "Operator rejected" });
  } catch (error) {
    console.error("rejectOperator error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ---------- PATCH /api/admin/operators/:id/suspend ----------
export const suspendOperator = async (req, res) => {
  try {
    const result = idParamSchema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }
    const id = result.data.id;

    const operator = await prisma.operator.findUnique({ where: { id } });
    if (!operator) return res.status(404).json({ message: "Operator not found" });

    // sirf APPROVED ko suspend kar sakte hain
    if (operator.status !== "APPROVED") {
      return res.status(409).json({ message: `Only APPROVED operators can be suspended (current: ${operator.status})` });
    }

    await prisma.operator.update({ where: { id }, data: { status: "SUSPENDED" } });
    return res.status(200).json({ message: "Operator suspended" });
  } catch (error) {
    console.error("suspendOperator error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};


// ---------- chhote helpers ----------
const routeLabel = (route) => `${route.sourceCity.name} to ${route.destinationCity.name}`; // "Lucknow to Delhi"
const dayOf = (date) => new Date(date).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD

// ---------- GET /api/admin/stats ----------
// users, bookings aur total sales (sirf CONFIRMED bookings ka paisa)
export const getAdminStats = async (req, res) => {
  try {
    const [users, bookings, sales] = await Promise.all([
      prisma.user.count(),
      prisma.booking.count({ where: { status: "CONFIRMED" } }),
      prisma.booking.aggregate({ where: { status: "CONFIRMED" }, _sum: { totalAmount: true } }),
    ]);
    return res.status(200).json({ users, bookings, revenue: sales._sum.totalAmount ?? 0 });
  } catch (error) {
    console.error("getAdminStats error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ---------- GET /api/admin/users  (?role=USER&search=aarav) ----------
export const getAdminUsers = async (req, res) => {
  try {
    const result = usersQuerySchema.safeParse(req.query);
    if (!result.success) return res.status(400).json({ message: result.error.issues[0].message });
    const { role, search } = result.data;

    const users = await prisma.user.findMany({
      where: {
        ...(role && { role }),
        // naam, email ya phone me search
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
          ],
        }),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true }, // password kabhi nahi
    });
    return res.status(200).json({ count: users.length, users });
  } catch (error) {
    console.error("getAdminUsers error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ---------- GET /api/admin/bookings  (?status=CONFIRMED) ----------
export const getAdminBookings = async (req, res) => {
  try {
    const result = bookingsQuerySchema.safeParse(req.query);
    if (!result.success) return res.status(400).json({ message: result.error.issues[0].message });
    const { status } = result.data;

    const rows = await prisma.booking.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        user: { select: { name: true } },
        trip: {
          select: {
            departureTime: true,
            route: {
              select: {
                sourceCity: { select: { name: true } },
                destinationCity: { select: { name: true } },
                operator: { select: { agencyName: true } },
              },
            },
          },
        },
      },
    });

    // frontend ko jaisa chahiye waisa seedha shape
    const bookings = rows.map((b) => ({
      id: b.id,
      passenger: b.user.name,
      operator: b.trip.route.operator.agencyName,
      route: routeLabel(b.trip.route),
      date: dayOf(b.trip.departureTime),
      amount: b.totalAmount,
      commission: b.commissionAmount ?? 0,
      status: b.status,
    }));
    return res.status(200).json({ count: bookings.length, bookings });
  } catch (error) {
    console.error("getAdminBookings error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};