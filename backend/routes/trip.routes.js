import express from "express";
import {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  cancelTrip,
} from "../controllers/trip.controllers.js"; 
import {
  verifyToken,
  authorizeRoles,
  requireApprovedOperator,
} from "../middlewares/auth.middlewares.js"; 

const TripRouter = express.Router();

TripRouter.get("/", verifyToken, authorizeRoles("OPERATOR", "ADMIN"), getTrips);
TripRouter.get("/:id", verifyToken, authorizeRoles("OPERATOR", "ADMIN"), getTripById);


TripRouter.post("/", verifyToken, authorizeRoles("OPERATOR"), requireApprovedOperator, createTrip);
TripRouter.patch("/:id", verifyToken, authorizeRoles("OPERATOR"), requireApprovedOperator, updateTrip);
TripRouter.patch("/:id/cancel", verifyToken, authorizeRoles("OPERATOR"), requireApprovedOperator, cancelTrip);

export default TripRouter;