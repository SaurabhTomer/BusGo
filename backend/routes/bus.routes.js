
import express from "express";
import {
  createBus,
  getBuses,
  getBusById,
  updateBus,
  deactivateBus,
} from "../controllers/bus.controllers.js"; 
import { verifyToken, authorizeRoles, requireApprovedOperator } from "../middlewares/auth.middlewares.js";
import { uploadBusRc } from "../controllers/document.controllers.js";
import { uploadFile } from "../middlewares/upload.middlewares.js";

const busRouter = express.Router();


busRouter.post("/:id/rc", verifyToken, authorizeRoles("OPERATOR"), requireApprovedOperator, uploadFile, uploadBusRc);


busRouter.get("/", verifyToken, authorizeRoles("OPERATOR", "ADMIN"), getBuses);
busRouter.get("/:id", verifyToken, authorizeRoles("OPERATOR", "ADMIN"), getBusById);

busRouter.post("/", verifyToken, authorizeRoles("OPERATOR"), requireApprovedOperator, createBus);
busRouter.patch("/:id", verifyToken, authorizeRoles("OPERATOR"), requireApprovedOperator, updateBus);
busRouter.delete("/:id", verifyToken, authorizeRoles("OPERATOR"), requireApprovedOperator, deactivateBus);

export default busRouter;