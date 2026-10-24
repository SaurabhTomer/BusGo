import express from "express";
import {
  createBooking,
  getMyBookings,
  getBookingById,
} from "../controllers/booking.controllers.js"; 
import { verifyToken, authorizeRoles } from "../middlewares/auth.middlewares.js"; // middlewares

const bookingRouter = express.Router();


bookingRouter.post("/", verifyToken, authorizeRoles("USER"),createBooking); 
bookingRouter.get("/",verifyToken, authorizeRoles("USER"), getMyBookings); 
bookingRouter.get("/:id",verifyToken, authorizeRoles("USER"), getBookingById); 

export default bookingRouter;