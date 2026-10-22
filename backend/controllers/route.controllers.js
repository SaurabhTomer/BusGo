import {prisma} from "../config/prismaClient.js"; 
import {
  createRouteSchema,
  updateRouteSchema,
  idParamSchema,
} from "../validations/route.validations.js"; 

// route ke saath cities ke naam bhi dikhane ke liye
const cityInclude = {
  sourceCity: { select: { id: true, name: true } },
  destinationCity: { select: { id: true, name: true } },
};

// operator ko sirf apne routes dikhane hain, admin ko saare
const ownerFilter = (req) =>
  req.user.role === "OPERATOR" ? { operator: { userId: req.user.id } } : {};

// ----------  CREATE ROUTE: POST /routes (approved operator) ----------
export const createRoute = async (req, res) => {
  try {
    const result = createRouteSchema.safeParse(req.body); 
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }
    const { sourceCityId, destinationCityId, distanceKm } = result.data;

    
    const cities = await prisma.city.findMany({
      where: { id: { in: [sourceCityId, destinationCityId] }, isActive: true },
    });
    if (cities.length !== 2) {
      return res.status(400).json({ message: "Select valid active cities" });
    }

    // route is operator ka ban raha hai (token se, body se nahi)
    const route = await prisma.route.create({
      data: { operatorId: req.operator.id, sourceCityId, destinationCityId, distanceKm },
      include: cityInclude,
    });

    return res.status(201).json({ message: "Route created", route });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "You already have this route" });
    }
    console.error("createRoute error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ----------  GET ROUTES: GET /routes ----------
export const getRoutes = async (req, res) => {
  try {
    const routes = await prisma.route.findMany({
      where: ownerFilter(req), // operator: apne, admin: saare
      orderBy: { id: "desc" },
      include: {
        ...cityInclude,
        operator: { select: { id: true, agencyName: true } }, // admin ko pata chale kiska hai
      },
    });
    return res.status(200).json({ routes });
  } catch (error) {
    console.error("getRoutes error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ----------  GET ONE ROUTE: GET /routes/:id ----------
export const getRouteById = async (req, res) => {
  try {
    const params = idParamSchema.safeParse(req.params);
    if (!params.success) {
      return res.status(400).json({ message: params.error.issues[0].message });
    }

    // id ke saath ownership bhi: dusre operator ka route mile hi nahi
    const route = await prisma.route.findFirst({
      where: { id: params.data.id, ...ownerFilter(req) },
      include: { ...cityInclude, _count: { select: { trips: true } } }, // kitne trips hain
    });
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    return res.status(200).json({ route });
  } catch (error) {
    console.error("getRouteById error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ---------- 4UPDATE ROUTE: PATCH /routes/:id (approved operator) ----------
export const updateRoute = async (req, res) => {
  try {
    const params = idParamSchema.safeParse(req.params); 
    if (!params.success) {
      return res.status(400).json({ message: params.error.issues[0].message });
    }
    const result = updateRouteSchema.safeParse(req.body); 
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }

    // where me operatorId bhi: sirf apna route update ho sakta hai
    const route = await prisma.route.update({
      where: { id: params.data.id, operatorId: req.operator.id },
      data: { distanceKm: result.data.distanceKm },
      include: cityInclude,
    });

    return res.status(200).json({ message: "Route updated", route });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Route not found" });
    }
    console.error("updateRoute error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ----------  DELETE ROUTE: DELETE /routes/:id (approved operator) ----------
export const deleteRoute = async (req, res) => {
  try {
    const params = idParamSchema.safeParse(req.params);
    if (!params.success) {
      return res.status(400).json({ message: params.error.issues[0].message });
    }
    const { id } = params.data;

    // pehle check: ye route is operator ka hai ya nahi
    const route = await prisma.route.findFirst({
      where: { id, operatorId: req.operator.id },
    });
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    // is route pe koi bhi trip hai (purani bhi) to delete nahi, kyunki bookings jude hain
    const tripCount = await prisma.trip.count({ where: { routeId: id } });
    if (tripCount > 0) {
      return res.status(409).json({ message: "Route has trips and cannot be deleted" });
    }

    await prisma.route.delete({ where: { id } });

    return res.status(200).json({ message: "Route deleted" });
  } catch (error) {
    console.error("deleteRoute error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};