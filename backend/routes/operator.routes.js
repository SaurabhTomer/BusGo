import express from "express";
import { operatorSignup, getMyOperator } from "../controllers/operator.controllers.js";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middlewares.js";

const operatorRouter = express.Router();

// operator signup: public (pehle /auth/send-otp aur /auth/verify-otp chalana hai)
operatorRouter.post("/signup", operatorSignup);

// apni profile aur application ki status
operatorRouter.get("/me", verifyToken, authorizeRoles("OPERATOR"), getMyOperator);

export default operatorRouter;