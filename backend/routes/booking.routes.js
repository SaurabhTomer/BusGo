import express from "express";
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
} from "../controllers/booking.controllers.js"; 
import { verifyToken, authorizeRoles } from "../middlewares/auth.middlewares.js"; 
import { bookingLimiter } from "../middlewares/rateLimiters.js";

const bookingRouter = express.Router();


bookingRouter.post("/", verifyToken, authorizeRoles("USER"),bookingLimiter,createBooking); 
bookingRouter.get("/",verifyToken, authorizeRoles("USER"), getMyBookings); 
bookingRouter.get("/:id",verifyToken, authorizeRoles("USER"), getBookingById); 
bookingRouter.patch("/:id/cancel", verifyToken, authorizeRoles("USER"), cancelBooking);

export default bookingRouter;