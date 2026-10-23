import prisma from "../config/prismaClient.js"; 
import {
  createTripSchema,
  updateTripSchema,
  listQuerySchema,
  idParamSchema,
} from "../validations/trip.validations.js"; 



const tripInclude = {
  bus: { select: { id: true, name: true, busNumber: true, type: true } },
  route: {
    select: {
      id: true,
      distanceKm: true,
      sourceCity: { select: { id: true, name: true } },
      destinationCity: { select: { id: true, name: true } },
    },
  },
};


const ownerFilter = (req) =>
  req.user.role === "OPERATOR" ? { bus: { operator: { userId: req.user.id } } } : {};

// ---------- Helper: is bus ki koi aur trip is time pe chal rahi hai kya ----------
// excludeId = update ke time khud ki trip ko ignore karne ke liye
const hasClash = async (busId, departureTime, arrivalTime, excludeId) => {
  const clash = await prisma.trip.findFirst({
    where: {
      busId,
      status: "SCHEDULED", 
      ...(excludeId && { id: { not: excludeId } }),
      departureTime: { lt: arrivalTime }, // unki trip meri arrival se pehle shuru hui
      arrivalTime: { gt: departureTime }, // aur meri departure ke baad khatam hogi, matlab overlap
    },
  });
  return Boolean(clash);
};

// ----------  CREATE TRIP: POST /trips (approved operator) ----------
export const createTrip = async (req, res) => {
  try {
    const result = createTripSchema.safeParse(req.body); 
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }
    const { busId, sourceCityId, destinationCityId, departureTime, arrivalTime, price } =
      result.data; 


    const bus = await prisma.bus.findFirst({
      where: { id: busId, operatorId: req.operator.id, isActive: true },
    });
    if (!bus) {
      return res.status(404).json({ message: "Active bus not found" });
    }

    
    const cities = await prisma.city.findMany({
      where: { id: { in: [sourceCityId, destinationCityId] }, isActive: true },
    });
    if (cities.length !== 2) {
      return res.status(400).json({ message: "Select valid active cities" });
    }

    
    if (await hasClash(busId, departureTime, arrivalTime)) {
      return res.status(409).json({ message: "This bus already has a trip at this time" });
    }

    // route pehle se hai to wahi lo, nahi hai to apne aap bana do
    const route = await prisma.route.upsert({
      where: {
        operatorId_sourceCityId_destinationCityId: {
          operatorId: req.operator.id,
          sourceCityId,
          destinationCityId,
        },
      },
      update: {}, // pehle se hai to kuch nahi badalna
      create: { operatorId: req.operator.id, sourceCityId, destinationCityId },
    });

    const trip = await prisma.trip.create({
      data: { busId, routeId: route.id, departureTime, arrivalTime, price },
      include: tripInclude,
    });

    return res.status(201).json({ message: "Trip created", trip });
  } catch (error) {
    console.error("createTrip error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ----------  GET TRIPS: GET /trips ----------
export const getTrips = async (req, res) => {
  try {
    const query = listQuerySchema.safeParse(req.query);
    if (!query.success) {
      return res.status(400).json({ message: query.error.issues[0].message });
    }
    const { status } = query.data;

    const trips = await prisma.trip.findMany({
      where: { ...ownerFilter(req), ...(status && { status }) }, 
      orderBy: { departureTime: "asc" },
      include: tripInclude,
    });

    return res.status(200).json({ trips });
  } catch (error) {
    console.error("getTrips error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ---------- GET ONE TRIP: GET /trips/:id ----------
export const getTripById = async (req, res) => {
  try {
    const params = idParamSchema.safeParse(req.params);
    if (!params.success) {
      return res.status(400).json({ message: params.error.issues[0].message });
    }

    
    const trip = await prisma.trip.findFirst({
      where: { id: params.data.id, ...ownerFilter(req) },
      include: tripInclude,
    });
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    return res.status(200).json({ trip });
  } catch (error) {
    console.error("getTripById error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ----------  UPDATE TRIP: PATCH /trips/:id (approved operator) ----------
export const updateTrip = async (req, res) => {
  try {
    const params = idParamSchema.safeParse(req.params); 
    if (!params.success) {
      return res.status(400).json({ message: params.error.issues[0].message });
    }
    const result = updateTripSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }
    const data = result.data;

  
    const trip = await prisma.trip.findFirst({
      where: { id: params.data.id, bus: { operatorId: req.operator.id } },
    });
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

  
    if (trip.status !== "SCHEDULED" || trip.departureTime <= new Date()) {
      return res.status(409).json({ message: "Only upcoming scheduled trips can be edited" });
    }

    
    const departureTime = data.departureTime ?? trip.departureTime;
    const arrivalTime = data.arrivalTime ?? trip.arrivalTime;

    if (data.departureTime && departureTime <= new Date()) {
      return res.status(400).json({ message: "Departure time must be in the future" });
    }
    if (arrivalTime <= departureTime) {
      return res.status(400).json({ message: "Arrival time must be after departure time" });
    }

    // time badla hai to overlap dobara check
    const timeChanged = data.departureTime || data.arrivalTime;
    if (timeChanged && (await hasClash(trip.busId, departureTime, arrivalTime, trip.id))) {
      return res.status(409).json({ message: "This bus already has a trip at this time" });
    }

    const updated = await prisma.trip.update({
      where: { id: trip.id },
      data: { price: data.price, departureTime, arrivalTime },
      include: tripInclude,
    });

    return res.status(200).json({ message: "Trip updated", trip: updated });
  } catch (error) {
    console.error("updateTrip error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ----------  CANCEL TRIP: PATCH /trips/:id/cancel (approved operator) ----------
export const cancelTrip = async (req, res) => {
  try {
    const params = idParamSchema.safeParse(req.params); 
    if (!params.success) {
      return res.status(400).json({ message: params.error.issues[0].message });
    }

  
    const trip = await prisma.trip.findFirst({
      where: { id: params.data.id, bus: { operatorId: req.operator.id } },
    });
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

 
    if (trip.status !== "SCHEDULED") {
      return res.status(409).json({ message: `Trip is already ${trip.status.toLowerCase()}` });
    }

    const updated = await prisma.trip.update({
      where: { id: trip.id },
      data: { status: "CANCELLED" },
      include: tripInclude,
    });

    return res.status(200).json({ message: "Trip cancelled", trip: updated });
  } catch (error) {
    console.error("cancelTrip error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};