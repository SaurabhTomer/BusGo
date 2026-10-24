import {prisma} from "../config/prismaClient.js"; 
import { searchTripsSchema , tripIdParamSchema } from "../validations/search.validations.js"; 

// ---------- SEARCH TRIPS: GET /search/trips?from=..&to=..&date=.. (public) ----------
export const searchTrips = async (req, res) => {
  try {
    const result = searchTripsSchema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }
    const { from, to, date } = result.data; 

    // us din ka shuru aur khatam (India ke time ke hisaab se, +05:30)
    const dayStart = new Date(`${date}T00:00:00+05:30`); // raat 12 baje
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000); // agle din raat 12 baje

    // aaj ki date ho to beeti hui trips nahi dikhani, isliye shuru "abhi" se
    const now = new Date();
    const startTime = dayStart > now ? dayStart : now;

       const trips = await prisma.trip.findMany({
      where: {
        status: "SCHEDULED",
        departureTime: { gte: startTime, lt: dayEnd }, // usi din ki, abhi se baad ki
        bus: { isActive: true },
        route: {
          sourceCityId: from,
          destinationCityId: to,
          operator: { status: "APPROVED" },
        },
      },
      orderBy: { departureTime: "asc" },
      select: {
        id: true,
        departureTime: true,
        arrivalTime: true,
        price: true,
        _count: { select: { bookingSeats: true } }, //  trip ki kitni seats booked hain
        bus: { select: { name: true, type: true, totalSeats: true } },
        route: {
          select: {
            sourceCity: { select: { name: true } },
            destinationCity: { select: { name: true } },
            operator: { select: { agencyName: true } },
          },
        },
      },
    });

    // har trip me availableSeats jodo
    // abhi booking bani nahi, isliye saari seats khali hain (booking ke baad yaha se booked seats ghatayenge)
      const list = trips.map((trip) => ({
      ...trip,
      availableSeats: trip.bus.totalSeats - trip._count.bookingSeats, // total me se booked ghata do
    }));

    return res.status(200).json({ count: list.length, trips: list });
  } catch (error) {
    console.error("searchTrips error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ---------- TRIP SEATS: GET /search/trips/:id/seats (public) ----------
// ---------- GET /api/search/trips/:id/seats ----------
export const getTripSeats = async (req, res) => {
  try {
    const result = tripIdParamSchema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }
    const tripId = result.data.id;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true, busId: true, price: true, status: true },
    });
    if (!trip || trip.status !== "SCHEDULED") {
      return res.status(404).json({ message: "Trip not found" });
    }

    // bus ki sari seats + is trip pe jo seats li gayi hain (booking ka status ke saath)
    const seats = await prisma.seat.findMany({
      where: { busId: trip.busId },
      orderBy: [{ row: "asc" }, { col: "asc" }],
      include: {
        bookingSeats: {
          where: { tripId },
          select: { booking: { select: { status: true } } },
        },
      },
    });

    const seatMap = seats.map((seat) => {
      const taken = seat.bookingSeats[0]; // is trip pe is seat ki booking (agar hai)
      let status = "AVAILABLE";
      if (taken) {
        // CONFIRMED = payment ho gaya, PENDING = abhi 5 min ke liye hold
        status = taken.booking.status === "CONFIRMED" ? "BOOKED" : "HELD";
      }
      return { id: seat.id, seatNumber: seat.seatNumber, row: seat.row, col: seat.col, status };
    });

    const summary = {
      total: seatMap.length,
      available: seatMap.filter((s) => s.status === "AVAILABLE").length,
      held: seatMap.filter((s) => s.status === "HELD").length,
      booked: seatMap.filter((s) => s.status === "BOOKED").length,
    };

    return res.status(200).json({ price: trip.price, seats: seatMap, summary });
  } catch (error) {
    console.error("getTripSeats error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};