import {prisma} from "../config/prismaClient.js"; 
import { createBookingSchema, bookingIdParamSchema } from "../validations/booking.validations.js";
import { lockSeats, releaseSeats } from "../utils/seatLock.js";

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