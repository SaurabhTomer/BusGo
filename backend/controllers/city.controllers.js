import {prisma} from "../config/prismaClient.js"; 
import {
  createCitySchema,
  updateCitySchema,
  idParamSchema,
} from "../validations/city.validations.js"; 

// "  navi   MUMBAI " se "Navi Mumbai"
const formatName = (name) =>
  name
    .replace(/\s+/g, " ") 
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) 
    .join(" ");

// ----------  CREATE CITY: POST /admin/cities (admin) ----------
export const createCity = async (req, res) => {
  try {
    const result = createCitySchema.safeParse(req.body); // body check
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }
    const name = formatName(result.data.name); // sahi format
    const slug = name.toLowerCase(); // duplicate rokne ke liye

    const city = await prisma.city.create({
      data: { name, slug, state: result.data.state },
    });

    return res.status(201).json({ message: "City created", city });
  } catch (error) {
    // P2002 = ye city pehle se hai
    if (error.code === "P2002") {
      return res.status(409).json({ message: "City already exists" });
    }
    console.error("createCity error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ----------  PUBLIC LIST: GET /cities  ----------

export const getCities = async (req, res) => {
  try {
    const cities = await prisma.city.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" }, // A se Z
      select: { id: true, name: true, state: true },
    });
    return res.status(200).json({ cities });
  } catch (error) {
    console.error("getCities error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ---------- ADMIN LIST: GET /admin/cities ----------
export const getAllCities = async (req, res) => {
  try {
    const cities = await prisma.city.findMany({ orderBy: { name: "asc" } });
    return res.status(200).json({ cities });
  } catch (error) {
    console.error("getAllCities error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ----------  UPDATE CITY: PATCH /admin/cities/:id (admin) ----------
export const updateCity = async (req, res) => {
  try {
    const params = idParamSchema.safeParse(req.params); 
    if (!params.success) {
      return res.status(400).json({ message: params.error.issues[0].message });
    }
    const result = updateCitySchema.safeParse(req.body); 
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }

    const data = { ...result.data };
 
    if (data.name) {
      data.name = formatName(data.name);
      data.slug = data.name.toLowerCase();
    }

    const city = await prisma.city.update({ where: { id: params.data.id }, data });

    return res.status(200).json({ message: "City updated", city });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "City not found" });
    }
    if (error.code === "P2002") {
      return res.status(409).json({ message: "City already exists" });
    }
    console.error("updateCity error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ----------  REMOVE CITY: DELETE /admin/cities/:id (admin) ----------

export const removeCity = async (req, res) => {
  try {
    const params = idParamSchema.safeParse(req.params); 
    if (!params.success) {
      return res.status(400).json({ message: params.error.issues[0].message });
    }
    const { id } = params.data;

  
    const upcomingTrips = await prisma.trip.count({
      where: {
        status: "SCHEDULED",
        departureTime: { gt: new Date() },
        route: { OR: [{ sourceCityId: id }, { destinationCityId: id }] },
      },
    });
    if (upcomingTrips > 0) {
      return res
        .status(409)
        .json({ message: "This city has upcoming trips. Cancel them first" });
    }

    await prisma.city.update({ where: { id }, data: { isActive: false } });

    return res.status(200).json({ message: "City removed" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "City not found" });
    }
    console.error("removeCity error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};