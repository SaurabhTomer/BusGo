import express from "express"; 
import {
  sendOtp,
  verifyOtp,
  signup,
} from "../controllers/auth.controllers.js"; 

const authRouter = express.Router(); 


authRouter.post("/send-otp", sendOtp);
authRouter.post("/verify-otp", verifyOtp);
authRouter.post("/signup", signup);

export default authRouter; 