

import express from "express"; 
import {
  sendOtp,
  verifyOtp,
  signup,
  login,
  refresh,
  logout,
  getMe,
  changePassword,
} from "../controllers/auth.controllers.js"; 
import { verifyToken, authorizeRoles } from "../middlewares/auth.middlewares.js"; 
import { loginLimiter, otpLimiter, verifyOtpLimiter } from "../middlewares/rateLimiters.js";


const authRouter = express.Router(); 

// ---------- Public routes (token ki zaroorat nahi) ----------

authRouter.post("/send-otp",otpLimiter, sendOtp);

authRouter.post("/verify-otp",verifyOtpLimiter, verifyOtp);

authRouter.post("/signup", signup);

authRouter.post("/login", loginLimiter,login);

authRouter.post("/refresh", refresh);

authRouter.post("/logout", logout);

// ---------- Protected routes (access token chahiye) ----------

authRouter.get("/me", verifyToken, getMe);
authRouter.post("/change-password", verifyToken, changePassword);

// SIRF TESTING KE LIYE: role check test karne ke baad ye route delete kar dena
authRouter.get("/admin-test", verifyToken, authorizeRoles("ADMIN"), (req, res) => {
  res.json({ message: "Welcome admin", user: req.user });
});

export default authRouter; 