import express from "express";
import {
  createRoute,
  getRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
} from "../controllers/route.controllers.js"; 
import {
  verifyToken,
  authorizeRoles,
  requireApprovedOperator,
} from "../middlewares/auth.middlewares.js"; 

const router = express.Router();


router.get("/", verifyToken, authorizeRoles("OPERATOR", "ADMIN"), getRoutes);
router.get("/:id", verifyToken, authorizeRoles("OPERATOR", "ADMIN"), getRouteById);

router.post("/", verifyToken, authorizeRoles("OPERATOR"), requireApprovedOperator, createRoute);
router.patch("/:id", verifyToken, authorizeRoles("OPERATOR"), requireApprovedOperator, updateRoute);
router.delete("/:id", verifyToken, authorizeRoles("OPERATOR"), requireApprovedOperator, deleteRoute);

export default router;