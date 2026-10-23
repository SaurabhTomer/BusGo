import prisma from "../config/prismaClient.js"; 
import { searchTripsSchema } from "../validations/search.validations.js"; 

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
    const list = trips.map((trip) => ({ ...trip, availableSeats: trip.bus.totalSeats }));

    return res.status(200).json({ count: list.length, trips: list });
  } catch (error) {
    console.error("searchTrips error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};