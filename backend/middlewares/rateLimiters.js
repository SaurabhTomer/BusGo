import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redis from "../config/redis.js";

// ek limiter banane ka helper
// windowMs = kitne time me, max = kitni requests, byUser = login user ke hisaab se ginti (warna IP se)
const makeLimiter = ({ prefix, windowMs, max, message }) =>
  rateLimit({
    windowMs,
    limit: max,
    standardHeaders: true, // response me RateLimit-* headers
    legacyHeaders: false,
    // ginti Redis me rakhte hain: server restart ya do server pe bhi sahi chalegi
    store: new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix: `rl:${prefix}:`,
    }),
    // limit paar hui to ye jawab
    handler: (req, res) => res.status(429).json({ message }),
    
    skip: () => process.env.RATE_LIMIT_OFF === "true",
  });

const MIN = 60 * 1000;


export const globalLimiter = makeLimiter({
  prefix: "global", windowMs: MIN, max: 100,
  message: "Too many requests. Please slow down",
});


export const otpLimiter = makeLimiter({
  prefix: "otp", windowMs: 15 * MIN, max: 5,
  message: "Too many OTP requests. Try again after 15 minutes",
});


export const verifyOtpLimiter = makeLimiter({
  prefix: "verify-otp", windowMs: 15 * MIN, max: 10,
  message: "Too many attempts. Try again after 15 minutes",
});


export const loginLimiter = makeLimiter({
  prefix: "login", windowMs: 15 * MIN, max: 10,
  message: "Too many login attempts. Try again after 15 minutes",
});


export const searchLimiter = makeLimiter({
  prefix: "search", windowMs: MIN, max: 60,
  message: "Too many searches. Please slow down",
});


export const bookingLimiter = makeLimiter({
  prefix: "booking", windowMs: MIN, max: 10, 
  message: "Too many booking attempts. Please wait a minute",
});


export const orderLimiter = makeLimiter({
  prefix: "order", windowMs: MIN, max: 10, 
  message: "Too many payment attempts. Please wait a minute",
});