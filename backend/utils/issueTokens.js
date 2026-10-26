import crypto from "crypto"; // random refresh token ke liye
import redis from "../config/redis.js"; // apni redis file ka path/naam rakhna
import { signToken } from "../config/jwt.js"; // access token banane ke liye
import { REFRESH_EXPIRY, refreshKey } from "../constants/auth.constants.js";


const isProd = process.env.NODE_ENV === "production";


// refresh cookie ki settings
export const cookieOptions = {
  httpOnly: true, // JavaScript se cookie padhi nahi ja sakti
  secure: isProd, // production me sirf https pe
  sameSite: isProd ? "none" : "lax", // dusri site se cookie nahi jaayegi
  maxAge: REFRESH_EXPIRY * 1000, // 7 din (milliseconds me)
};

// access + refresh token banata hai, refresh ko cookie me set karta hai
export const issueTokens = async (user, res) => {
  const accessToken = signToken({ id: user.id, role: user.role }); // 15 minute wala token
  const refreshToken = crypto.randomBytes(40).toString("hex"); // random refresh token
  await redis.set(refreshKey(refreshToken), user.id, "EX", REFRESH_EXPIRY); // redis me save
  res.cookie("refreshToken", refreshToken, cookieOptions); // cookie me bhejo
  return accessToken;
};