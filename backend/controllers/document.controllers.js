import { prisma } from "../config/prismaClient.js";
import { uploadBuffer, deleteFile, getTempUrl } from "../utils/cloudinaryUpload.js";
import { uploadDocumentSchema, idParamSchema } from "../validations/document.validation.js";

// user ko dikhane wali fields (publicId nahi, wo andar ki baat hai)
const publicFields = { id: true, type: true, busId: true, format: true, createdAt: true, updatedAt: true };

// ---------- Document save karna (upload + purani file replace) ----------
// where = purani file dhundhne ki shart (jaise: is operator ka PAN)
const saveDocument = async ({ operatorId, busId = null, type, file, folder }) => {
  // 1) pehle nayi file upload (fail hui to purani file bachi rahegi)
  const uploaded = await uploadBuffer(file.buffer, folder);

  // 2) purani file dhundo
  const old = await prisma.operatorDocument.findFirst({ where: { operatorId, busId, type } });

  // 3) DB me nayi row (ya purani ko update)
  const data = {
    publicId: uploaded.public_id,
    format: uploaded.format || (file.mimetype === "application/pdf" ? "pdf" : "jpg"),
    resourceType: uploaded.resource_type,
  };
  const doc = old
    ? await prisma.operatorDocument.update({ where: { id: old.id }, data, select: publicFields })
    : await prisma.operatorDocument.create({ data: { operatorId, busId, type, ...data }, select: publicFields });

  // 4) purani file Cloudinary se hatao
  if (old) await deleteFile(old.publicId, old.resourceType);
  return doc;
};

// ---------- POST /api/operators/me/documents (form-data: type, file) ----------
export const uploadOperatorDocument = async (req, res) => {
  try {
    const result = uploadDocumentSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }
    const { type } = result.data;

    const operator = await prisma.operator.findUnique({ where: { userId: req.user.id } });
    if (!operator) return res.status(404).json({ message: "Operator profile not found" });

    const doc = await saveDocument({
      operatorId: operator.id,
      type,
      file: req.file,
      folder: `busgo/operators/${operator.id}`,
    });
    return res.status(201).json({ message: `${type} uploaded`, document: doc });
  } catch (error) {
    console.error("uploadOperatorDocument error:", error?.message || error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ---------- GET /api/operators/me/documents ----------
export const getMyDocuments = async (req, res) => {
  try {
    const operator = await prisma.operator.findUnique({ where: { userId: req.user.id } });
    if (!operator) return res.status(404).json({ message: "Operator profile not found" });

    const documents = await prisma.operatorDocument.findMany({
      where: { operatorId: operator.id },
      select: { ...publicFields, bus: { select: { name: true, busNumber: true } } },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ count: documents.length, documents });
  } catch (error) {
    console.error("getMyDocuments error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ---------- POST /api/buses/:id/rc (form-data: file) ----------
// requireApprovedOperator pehle chalta hai, to req.operator mil jata hai
export const uploadBusRc = async (req, res) => {
  try {
    const result = idParamSchema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }
    const busId = result.data.id;

    // bus isi operator ki honi chahiye
    const bus = await prisma.bus.findFirst({ where: { id: busId, operatorId: req.operator.id } });
    if (!bus) return res.status(404).json({ message: "Bus not found" });

    const doc = await saveDocument({
      operatorId: req.operator.id,
      busId,
      type: "RC",
      file: req.file,
      folder: `busgo/buses/${busId}`,
    });
    return res.status(201).json({ message: "RC uploaded", document: doc });
  } catch (error) {
    console.error("uploadBusRc error:", error?.message || error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ---------- GET /api/admin/operators/:id/documents ----------
// admin ko operator ke saare documents (PAN, GST, saari buses ke RC) temporary link ke saath
export const getOperatorDocumentsForAdmin = async (req, res) => {
  try {
    const result = idParamSchema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }
    const operatorId = result.data.id;

    const operator = await prisma.operator.findUnique({ where: { id: operatorId } });
    if (!operator) return res.status(404).json({ message: "Operator not found" });

    const docs = await prisma.operatorDocument.findMany({
      where: { operatorId },
      include: { bus: { select: { name: true, busNumber: true } } },
      orderBy: { createdAt: "asc" },
    });

    const documents = docs.map((d) => ({
      id: d.id,
      type: d.type,
      bus: d.bus, // RC ho to bus ki detail, warna null
      format: d.format,
      uploadedAt: d.updatedAt,
      url: getTempUrl(d), // 10 minute me expire
    }));

    return res.status(200).json({ count: documents.length, linkValidFor: "10 minutes", documents });
  } catch (error) {
    console.error("getOperatorDocumentsForAdmin error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};