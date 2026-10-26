import {prisma} from "../config/prismaClient.js"; 
import { createBookingSchema, bookingIdParamSchema } from "../validations/booking.validations.js";
import { lockSeats, releaseSeats } from "../utils/seatLock.js";
import { getRefundPercent, refundPayment } from "../utils/refund.js";
import { emitSeatUpdate } from "../config/socket.js";

const HOLD_MINUTES = 5; 

// ---------- POST /api/bookings ----------
export const createBooking = async (req, res) => {
  let locked = false; // Redis lock liya ya nahi
  let tripId, seatIds;
  try {
    const result = createBookingSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }
    ({ tripId, seatIds } = result.data);
    const userId = req.user.id;

    // trip hai? scheduled hai? operator approved hai?
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { bus: { include: { operator: true } } },
    });
    if (!trip || trip.status !== "SCHEDULED" || trip.bus.operator.status !== "APPROVED") {
      return res.status(404).json({ message: "Trip not available" });
    }
    if (trip.departureTime <= new Date()) {
      return res.status(400).json({ message: "Trip has already departed" });
    }

    // seats isi trip ki bus ki hone chahiye
    const seatCount = await prisma.seat.count({
      where: { id: { in: seatIds }, busId: trip.busId },
    });
    if (seatCount !== seatIds.length) {
      return res.status(400).json({ message: "Invalid seats for this trip" });
    }

    // STEP 1: Redis me seats pakdo (fast gate, ek hi user jeetega)
    locked = await lockSeats(tripId, seatIds, userId);
    if (!locked) {
      return res.status(409).json({ message: "One or more seats are being booked by someone else" });
    }

    // STEP 2: DB me booking + seats ek saath (nested create = atomic)
    const booking = await prisma.booking.create({
      data: {
        userId,
        tripId,
        totalAmount: trip.price * seatIds.length, 
        expiresAt: new Date(Date.now() + HOLD_MINUTES * 60 * 1000),
        seats: { create: seatIds.map((seatId) => ({ tripId, seatId })) },
      },
      include: { seats: { include: { seat: { select: { seatNumber: true } } } } },
    });

    emitSeatUpdate(tripId, seatIds, "HELD");

    return res.status(201).json({
      message: `Seats held for ${HOLD_MINUTES} minutes. Complete payment`,
      booking,
    });
  } catch (error) {
    // DB fail hua to lock chhod do, warna seat 5 min atki rahegi
    if (locked) await releaseSeats(tripId, seatIds, req.user.id);

    // P2002 = unique fail: DB ne bhi duplicate seat pakdi (last safety net)
    if (error.code === "P2002") {
      return res.status(409).json({ message: "Seat already booked" });
    }
    console.error("createBooking error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ---------- GET /api/bookings (meri bookings) ----------
// ---------- GET /api/bookings (meri bookings) ----------
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        trip: {
          select: {
            departureTime: true,
            arrivalTime: true,
            route: {
              select: {
                sourceCity: { select: { name: true } },
                destinationCity: { select: { name: true } },
              },
            },
          },
        },
        seats: { include: { seat: { select: { seatNumber: true } } } },
        // refund dikhane ke liye: payment aur uske refunds
        payments: {
          select: {
            status: true,
            amount: true,
            refunds: { select: { amount: true, status: true, createdAt: true } },
          },
        },
      },
    });
    return res.status(200).json({ count: bookings.length, bookings });
  } catch (error) {
    console.error("getMyBookings error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};


// ---------- GET /api/bookings/:id ----------
export const getBookingById = async (req, res) => {
  try {
    const result = bookingIdParamSchema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }

    // userId bhi where me: dusre user ki booking dekhne pe 404 aayega
    const booking = await prisma.booking.findFirst({
      where: { id: result.data.id, userId: req.user.id },
      include: {
        trip: { include: { route: { include: { sourceCity: true, destinationCity: true } }, bus: { select: { name: true, busNumber: true, type: true } } } },
        seats: { include: { seat: { select: { seatNumber: true } } } },
      },
    });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    return res.status(200).json({ booking });
  } catch (error) {
    console.error("getBookingById error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};



// ---------- PATCH /api/bookings/:id/cancel ----------
export const cancelBooking = async (req, res) => {
  try {
    const result = bookingIdParamSchema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }
    const bookingId = result.data.id;

    // sirf apni booking (trip, seats aur PAID payment ke saath)
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, userId: req.user.id },
      include: {
        trip: true,
        seats: true,
        payments: { where: { status: "PAID" }, take: 1 },
      },
    });
    if (!booking) return res.status(404).json({ message: "Booking not found" });


    if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
      return res.status(409).json({ message: `Booking is already ${booking.status}` });
    }
   
    if (booking.trip.departureTime <= new Date()) {
      return res.status(400).json({ message: "Trip has already departed" });
    }

   
    const wasPaid = booking.status === "CONFIRMED";
    const percent = wasPaid ? getRefundPercent(booking.trip.departureTime) : 0;
    const refundAmount = Math.floor((booking.totalAmount * percent) / 100); // rupees

    // booking CANCELLED + seats free, ek saath (transaction)
    const done = await prisma.$transaction(async (tx) => {
      // where me abhi wala status: do cancel ek saath aaye ya payment beech me aa gayi
      // to count 0 aayega aur hum aage nahi badhenge (double refund nahi hoga)
      const changed = await tx.booking.updateMany({
        where: { id: bookingId, status: booking.status },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      if (changed.count === 0) return false;

      await tx.bookingSeat.deleteMany({ where: { bookingId } }); // seats free
      return true;
    });
    if (!done) {
      return res.status(409).json({ message: "Booking just changed. Please try again" });
    }

    emitSeatUpdate(booking.tripId, booking.seats.map((s) => s.seatId), "AVAILABLE");

    // Redis lock bhi chhodo
    await releaseSeats(booking.tripId, booking.seats.map((s) => s.seatId), booking.userId);

    // refund (sirf agar amount > 0 aur PAID payment mili)
    let refund = null;
    const payment = booking.payments[0];
    if (wasPaid && refundAmount > 0) {
      if (!payment) {
        console.warn(`Booking ${bookingId} CONFIRMED but no PAID payment found. Check manually`);
      } else {
        refund = await refundPayment(payment, refundAmount, `User cancelled (${percent}% refund)`);
      }
    }

    // user ko saaf message
    let message = "Booking cancelled";
    if (wasPaid && refundAmount === 0) message = "Booking cancelled. No refund (less than 12 hours to departure)";
    if (refund?.ok) message = `Booking cancelled. Refund of Rs ${refundAmount} processed`;
    if (refund && !refund.ok) message = "Booking cancelled. Refund could not be sent now, it will be retried";

    return res.status(200).json({
      message,
      refundPercent: percent,
      refundAmount,
      refundStatus: refund ? refund.status : wasPaid ? "NOT_APPLICABLE" : "NOT_REQUIRED",
    });
  } catch (error) {
    console.error("cancelBooking error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};