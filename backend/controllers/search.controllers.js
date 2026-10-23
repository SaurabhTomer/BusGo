import prisma from "../config/prismaClient.js"; 
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
export const getTripSeats = async (req, res) => {
  try {
    const params = tripIdParamSchema.safeParse(req.params);
    if (!params.success) {
      return res.status(400).json({ message: params.error.issues[0].message });
    }

    // trip dhundo (wahi shartein jo search me thi, taaki chhupi hui trip ke seat map na dikhe)
    const trip = await prisma.trip.findFirst({
      where: {
        id: params.data.id,
        status: "SCHEDULED", 
        departureTime: { gt: new Date() }, 
        bus: { isActive: true }, 
        route: { operator: { status: "APPROVED" } }, 
      },
      select: {
        id: true,
        departureTime: true,
        arrivalTime: true,
        price: true,
        bus: { select: { id: true, name: true, type: true } },
        route: {
          select: {
            sourceCity: { select: { name: true } },
            destinationCity: { select: { name: true } },
          },
        },
      },
    });
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    // is bus ki saari seats (row aur column ke order me, taaki seat map seedha ban sake)
    const seats = await prisma.seat.findMany({
      where: { busId: trip.bus.id },
      orderBy: [{ row: "asc" }, { col: "asc" }],
      select: { id: true, seatNumber: true, row: true, col: true },
    });

    // is trip ki booked seats
    const bookedSeats = await prisma.bookingSeat.findMany({
      where: { tripId: trip.id },
      select: { seatId: true },
    });

    // booked seat ids ka Set (Set me "ye id hai ya nahi" check karna tez hota hai)
    const bookedIds = new Set(bookedSeats.map((item) => item.seatId));

    // har seat ke saath status jodo
    const seatList = seats.map((seat) => ({
      ...seat,
      status: bookedIds.has(seat.id) ? "BOOKED" : "AVAILABLE",
    }));

    return res.status(200).json({
      trip,
      summary: {
        total: seatList.length,
        booked: bookedIds.size,
        available: seatList.length - bookedIds.size,
      },
      seats: seatList,
    });
  } catch (error) {
    console.error("getTripSeats error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};