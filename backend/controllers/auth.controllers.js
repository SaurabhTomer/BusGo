import crypto from "crypto"; 
import bcrypt from "bcrypt"; 
import {prisma} from "../config/prismaClient.js";
import redis from "../config/redis.js";
import {
    sendOtpSchema,
    verifyOtpSchema,
    signupSchema,
    loginSchema,
} from "../validations/auth.validations.js";
import {
    OTP_EXPIRY,
    RESEND_COOLDOWN,
    MAX_ATTEMPTS,
    VERIFIED_EXPIRY,
    otpKey,
    cooldownKey,
    attemptsKey,
    verifiedKey,
    loginAttemptsKey,
    LOGIN_MAX_ATTEMPTS,
    refreshKey,
    REFRESH_EXPIRY,
} from "../constants/auth.constants.js";
import { issueTokens } from "../utils/issueTokens.js";





// ----------  SEND OTP : POST /auth/send-otp ----------
export const sendOtp = async (req, res) => {
    try {

        const result = sendOtpSchema.safeParse(req.body);           // check body with zod schema 
        if (!result.success) {
            return res.status(400).json({ message: result.error.issues[0].message });
        }
        const { phone } = result.data;                              // number after verify


        const existingUser = await prisma.user.findFirst({ where: { phone } });         // if number exists already
        if (existingUser) {
            return res.status(409).json({ message: "Phone already registered" });
        }


        const onCooldown = await redis.get(cooldownKey(phone));         // cooldown check :- wait till 60 seconds to request new otp
        if (onCooldown) {
            return res
                .status(429)
                .json({ message: "Please wait 60 seconds before requesting OTP again" });
        }


        const otp = crypto.randomInt(100000, 1000000).toString();               // OTP


        await redis.set(otpKey(phone), otp, "EX", OTP_EXPIRY);          // set OTP in redis with expiry

        await redis.set(cooldownKey(phone), "1", "EX", RESEND_COOLDOWN);        // can re-send OTP after the cooldown period

        await redis.del(attemptsKey(phone));        // reset all previous OTP attempts

        // mock SMS: abhi terminal me print kar rahe hain (baad me asli SMS service lagana)
        console.log(`[MOCK SMS] OTP for ${phone} is ${otp}`);

        return res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
        console.error("sendOtp error:", error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

// ----------  VERIFY OTP: POST /auth/verify-otp ----------
export const verifyOtp = async (req, res) => {
    try {

        const result = verifyOtpSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ message: result.error.issues[0].message });
        }
        const { phone, otp } = result.data;


        const savedOtp = await redis.get(otpKey(phone));
        if (!savedOtp) {
            return res
                .status(400)
                .json({ message: "OTP expired or not requested. Send OTP again" });
        }


        const attempts = await redis.incr(attemptsKey(phone));
        // pehli attempt pe expiry laga do, taaki key hamesha ke liye na rahe
        if (attempts === 1) {
            await redis.expire(attemptsKey(phone), OTP_EXPIRY);
        }

        if (attempts > MAX_ATTEMPTS) {          // if attempts to enter OTP are greater than max attempts
            await redis.del(otpKey(phone));
            return res
                .status(429)
                .json({ message: "Too many wrong attempts. Send OTP again" });
        }


        if (otp !== savedOtp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // OTP sahi hai: OTP aur attempts delete karo 
        await redis.del(otpKey(phone));
        await redis.del(attemptsKey(phone));

        // mark phone verified and check at the time of signup 
        await redis.set(verifiedKey(phone), "1", "EX", VERIFIED_EXPIRY);

        return res.status(200).json({ message: "Phone verified successfully" });
    } catch (error) {
        console.error("verifyOtp error:", error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

// ----------  SIGNUP: POST /auth/signup ----------
export const signup = async (req, res) => {
    try {

        const result = signupSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ message: result.error.issues[0].message });
        }
        const { name, email, phone, password } = result.data;

        
        const isVerified = await redis.get(verifiedKey(phone));// Check phone is verified with otp or not by redis key 
        if (!isVerified) {
            return res.status(403).json({ message: "Please verify your phone first" });
        }

        const emailExists = await prisma.user.findUnique({ where: { email } });
        if (emailExists) {
            return res.status(409).json({ message: "Email already registered" });
        }


        const phoneExists = await prisma.user.findUnique({ where: { phone } });
        if (phoneExists) {
            return res.status(409).json({ message: "Phone already registered" });
        }


        const hashedPassword = await bcrypt.hash(password, 10);


        const user = await prisma.user.create({
            data: { name, email, phone, password: hashedPassword },
            select: { id: true, name: true, email: true, phone: true, role: true },         // password response me wapas nahi bhejna
        });

        await redis.del(verifiedKey(phone));        // dlt verified flag 

        
         const token = await issueTokens(user, res); // access token milega, refresh cookie me chala gaya

        return res.status(201).json({ message: "Signup successful", token ,  user });
    } catch (error) {
        // P2002 = unique constraint fail (do log ek saath signup kare to yaha aayega)
        if (error.code === "P2002") {
            return res.status(409).json({ message: "Email or phone already registered" });
        }
        console.error("signup error:", error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

// ----------  LOGIN: POST /auth/login ----------
export const login = async (req, res) => {
  try {
    
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }
    const { email, password } = result.data; 

    
    const attempts = await redis.get(loginAttemptsKey(email));
    if (attempts && Number(attempts) >= LOGIN_MAX_ATTEMPTS) {
      return res
        .status(429)
        .json({ message: "Too many failed attempts. Try again after 15 minutes" });
    }

    const user = await prisma.user.findUnique({ where: { email } });

   
    const isMatch = user ? await bcrypt.compare(password, user.password) : false;

    if (!isMatch) {
      const count = await redis.incr(loginAttemptsKey(email));
      if (count === 1) {
        await redis.expire(loginAttemptsKey(email), LOGIN_LOCK_TIME);
      }
      return res.status(401).json({ message: "Invalid email or password" });
    }


    await redis.del(loginAttemptsKey(email));


    const token = await issueTokens(user, res); // access token milega, refresh cookie me chala gaya


    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("login error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};


// ---------- REFRESH: POST /auth/refresh ----------
export const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token missing" });
    }

    // redis se userId nikalo AUR  delete karo (ek token sirf ek baar use hoga)
    const userId = await redis.getdel(refreshKey(refreshToken));
    if (!userId) {
      res.clearCookie("refreshToken");
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    // user abhi bhi DB me hai ya nahi
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.clearCookie("refreshToken");
      return res.status(401).json({ message: "User not found" });
    }

    // naya access token + naya refresh token (rotation)
    const token = await issueTokens(user, res);

    return res.status(200).json({ message: "Token refreshed", token });
  } catch (error) {
    console.error("refresh error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ---------- LOGOUT: POST /auth/logout ----------
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    // redis se refresh token delete, ab ye kabhi kaam nahi karega
    if (refreshToken) {
      await redis.del(refreshKey(refreshToken));
    }

    // browser se cookie bhi hata do
    res.clearCookie("refreshToken");

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("logout error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};


// ---------- ME: GET /auth/me ----------
export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true }, 
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("getMe error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};