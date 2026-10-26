import express from "express";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middlewares.js";
import { getMyDocuments, uploadOperatorDocument } from "../controllers/document.controllers.js";
import { uploadFile } from "../middlewares/upload.middlewares.js";
import { operatorSignup, getMyOperator, getMyStats, getMyBookings, getMyEarnings, reapply } from "../controllers/operator.controllers.js";
const operatorRouter = express.Router();


operatorRouter.post("/signup", operatorSignup);


operatorRouter.get("/me", verifyToken, authorizeRoles("OPERATOR"), getMyOperator);

operatorRouter.post("/me/documents", verifyToken, authorizeRoles("OPERATOR"), uploadFile, uploadOperatorDocument);
operatorRouter.get("/me/documents", verifyToken, authorizeRoles("OPERATOR"), getMyDocuments);
operatorRouter.get("/me/stats", verifyToken, authorizeRoles("OPERATOR"), getMyStats);
operatorRouter.get("/me/bookings", verifyToken, authorizeRoles("OPERATOR"), getMyBookings);
operatorRouter.get("/me/earnings", verifyToken, authorizeRoles("OPERATOR"), getMyEarnings);
operatorRouter.post("/me/reapply", verifyToken, authorizeRoles("OPERATOR"), reapply);

export default operatorRouter;