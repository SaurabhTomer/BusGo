import {prisma} from "../config/prismaClient.js"; // apne auth controller wali hi import line rakhna
import {
  createBusSchema,
  updateBusSchema,
  idParamSchema,
} from "../validations/bus.validations.js"; 

// operator ko sirf apni buses dikhani hain, admin ko saari
const ownerFilter = (req) =>
  req.user.role === "OPERATOR" ? { operator: { userId: req.user.id } } : {};

// ---------- CREATE BUS: POST /buses ----------
export const createBus = async (req, res) => {
  try {
    const result = createBusSchema.safeParse(req.body); 
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }
    const { name, busNumber, type, totalSeats } = result.data;

    // seats ki list: 4 seats ek row me (2+2 layout)
    const seats = Array.from({ length: totalSeats }, (_, i) => ({
      seatNumber: String(i + 1), 
      row: Math.floor(i / 4) + 1, 
      col: (i % 4) + 1, 
    }));

    // bus + seats ek saath, aur bus is operator ki ban rahi hai 
    const bus = await prisma.bus.create({
      data: {
        name,
        busNumber,
        type,
        totalSeats,
        operatorId: req.operator.id, // requireApprovedOperator ne set kiya
        seats: { create: seats },
      },
      include: { _count: { select: { seats: true } } },
    });

    return res.status(201).json({ message: "Bus created", bus });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "Bus number already exists" });
    }
    console.error("createBus error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ----------  GET BUSES: GET /buses ----------
export const getBuses = async (req, res) => {
  try {
    const buses = await prisma.bus.findMany({
      where: ownerFilter(req), // operator: sirf apni, admin: saari
      orderBy: { createdAt: "desc" },
      // admin ko pata chale ki bus kis agency ki hai
      include: { operator: { select: { id: true, agencyName: true, status: true } } },
    });
    return res.status(200).json({ buses });
  } catch (error) {
    console.error("getBuses error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ----------  GET ONE BUS: GET /buses/:id ----------
export const getBusById = async (req, res) => {
  try {
    const params = idParamSchema.safeParse(req.params); 
    if (!params.success) {
      return res.status(400).json({ message: params.error.issues[0].message });
    }

    // id ke saath ownership bhi: dusre operator ki bus mile hi nahi
    const bus = await prisma.bus.findFirst({
      where: { id: params.data.id, ...ownerFilter(req) },
      include: {
        seats: { orderBy: [{ row: "asc" }, { col: "asc" }] },
        operator: { select: { id: true, agencyName: true, status: true } },
      },
    });
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    return res.status(200).json({ bus });
  } catch (error) {
    console.error("getBusById error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ---------- UPDATE BUS: PATCH /buses/:id  ----------
export const updateBus = async (req, res) => {
  try {
    const params = idParamSchema.safeParse(req.params); 
    if (!params.success) {
      return res.status(400).json({ message: params.error.issues[0].message });
    }
    const result = updateBusSchema.safeParse(req.body); 
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }

   
    const bus = await prisma.bus.update({
      where: { id: params.data.id, operatorId: req.operator.id },
      data: result.data,
    });

    return res.status(200).json({ message: "Bus updated", bus });
  } catch (error) {
    // P2025 = bus mili nahi (ya dusre operator ki hai)
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Bus not found" });
    }
    console.error("updateBus error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ---------DEACTIVATE BUS: DELETE /buses/:id  ----------
export const deactivateBus = async (req, res) => {
  try {
    const params = idParamSchema.safeParse(req.params); 
    if (!params.success) {
      return res.status(400).json({ message: params.error.issues[0].message });
    }
    const { id } = params.data;

    // pehle check: ye bus is operator ki hai ya nahi
    const bus = await prisma.bus.findFirst({
      where: { id, operatorId: req.operator.id },
    });
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    // aage ke trips bache hain to band nahi kar sakte
    const upcomingTrips = await prisma.trip.count({
      where: { busId: id, status: "SCHEDULED", departureTime: { gt: new Date() } },
    });
    if (upcomingTrips > 0) {
      return res.status(409).json({ message: "Bus has upcoming trips. Cancel them first" });
    }

    await prisma.bus.update({ where: { id }, data: { isActive: false } });

    return res.status(200).json({ message: "Bus deactivated" });
  } catch (error) {
    console.error("deactivateBus error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};