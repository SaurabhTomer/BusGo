import {prisma} from "../config/prismaClient.js"; 
import {
  idParamSchema,
  listQuerySchema,
  rejectSchema,
} from "../validations/admin.validations.js"; 


const userSelect = { select: { id: true, name: true, email: true, phone: true, createdAt: true } };

// ----------  LIST OPERATORS: GET /admin/operators?status=PENDING ----------
export const getOperators = async (req, res) => {
  try {
    const query = listQuerySchema.safeParse(req.query);
    if (!query.success) {
      return res.status(400).json({ message: query.error.issues[0].message });
    }
    const { status } = query.data;

    const operators = await prisma.operator.findMany({
      where: status ? { status } : {}, 
      orderBy: { createdAt: "desc" }, 
      include: { user: userSelect },
    });

    return res.status(200).json({ operators });
  } catch (error) {
    console.error("getOperators error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ----------  ONE OPERATOR: GET /admin/operators/:id ----------
export const getOperatorById = async (req, res) => {
  try {
    const params = idParamSchema.safeParse(req.params);
    if (!params.success) {
      return res.status(400).json({ message: params.error.issues[0].message });
    }

    const operator = await prisma.operator.findUnique({
      where: { id: params.data.id },
      include: {
        user: userSelect,
        _count: { select: { buses: true, routes: true } }, 
      },
    });
    if (!operator) {
      return res.status(404).json({ message: "Operator not found" });
    }

    return res.status(200).json({ operator });
  } catch (error) {
    console.error("getOperatorById error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ---------- Helper: status badalne ka kaam (approve/reject/suspend teeno ye use karte hain) ----------
// allowedFrom = kin status se badal sakte hain, to = naya status, extra = saath me aur kya badalna hai
const changeStatus = async (req, res, { allowedFrom, to, extra = {}, doneMessage }) => {
  const params = idParamSchema.safeParse(req.params);
  if (!params.success) {
    return res.status(400).json({ message: params.error.issues[0].message });
  }


  const operator = await prisma.operator.findUnique({ where: { id: params.data.id } });
  if (!operator) {
    return res.status(404).json({ message: "Operator not found" });
  }

  if (!allowedFrom.includes(operator.status)) {
    return res
      .status(409)
      .json({ message: `Cannot do this when operator is ${operator.status.toLowerCase()}` });
  }

  
  const updated = await prisma.operator.update({
    where: { id: operator.id },
    data: { status: to, ...extra },
  });

  return res.status(200).json({ message: doneMessage, operator: updated });
};

// ---------- APPROVE: PATCH /admin/operators/:id/approve ----------
export const approveOperator = async (req, res) => {
  try {
    return await changeStatus(req, res, {
      allowedFrom: ["PENDING", "SUSPENDED"], 
      to: "APPROVED",
      extra: { rejectionReason: null }, // purani reject ki wajah hata do
      doneMessage: "Operator approved",
    });
  } catch (error) {
    console.error("approveOperator error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ---------- REJECT: PATCH /admin/operators/:id/reject ----------
export const rejectOperator = async (req, res) => {
  try {
    const body = rejectSchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ message: body.error.issues[0].message });
    }

    return await changeStatus(req, res, {
      allowedFrom: ["PENDING"], 
      to: "REJECTED",
      extra: { rejectionReason: body.data.reason },
      doneMessage: "Operator rejected",
    });
  } catch (error) {
    console.error("rejectOperator error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ---------- SUSPEND: PATCH /admin/operators/:id/suspend ----------
export const suspendOperator = async (req, res) => {
  try {
    return await changeStatus(req, res, {
      allowedFrom: ["APPROVED"], 
      to: "SUSPENDED",
      doneMessage: "Operator suspended",
    });
  } catch (error) {
    console.error("suspendOperator error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};