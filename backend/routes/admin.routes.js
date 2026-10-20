import express from "express";
import {
  getOperators,
  getOperatorById,
  approveOperator,
  rejectOperator,
  suspendOperator,
} from "../controllers/admin.controllers.js"; 
import { verifyToken, authorizeRoles } from "../middlewares/auth.middlewares.js"; 

const adminRouter = express.Router();



adminRouter.get("/operators",verifyToken, authorizeRoles("ADMIN"), getOperators); //  (?status=PENDING)
adminRouter.get("/operators/:id",verifyToken, authorizeRoles("ADMIN"), getOperatorById); 
adminRouter.patch("/operators/:id/approve", verifyToken, authorizeRoles("ADMIN"),approveOperator);
adminRouter.patch("/operators/:id/reject", verifyToken, authorizeRoles("ADMIN"),rejectOperator); 
adminRouter.patch("/operators/:id/suspend",verifyToken, authorizeRoles("ADMIN"), suspendOperator); 

export default adminRouter;