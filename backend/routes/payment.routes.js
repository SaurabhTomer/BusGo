import express from "express";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middlewares.js";
import { createOrder, verifyPayment } from "../controllers/payment.controllers.js";
 
const paymentRouter = express.Router();
 
// sirf logged-in USER
paymentRouter.post("/create-order", verifyToken, authorizeRoles("USER"), createOrder);
paymentRouter.post("/verify", verifyToken, authorizeRoles("USER"), verifyPayment);
 
// webhook route yaha NAHI, index.js me express.json() se pehle lagega
 
export default paymentRouter;
 