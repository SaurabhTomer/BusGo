import bcrypt from "bcrypt"; 
import {prisma} from "../config/prismaClient.js";
import redis from "../config/redis.js"; 
import { operatorSignupSchema } from "../validations/operator.validations.js"; 
import { verifiedKey } from "../constants/auth.constants.js"; 
import { issueTokens } from "../utils/issueTokens.js"; 

// ----------  OPERATOR SIGNUP: POST /operators/signup ----------
export const operatorSignup = async (req, res) => {
  try {
    const result = operatorSignupSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }
    const { name, email, phone, password, agencyName, gstNo, contactPhone, address } =
      result.data;

    const isVerified = await redis.get(verifiedKey(phone));
    if (!isVerified) {
      return res.status(403).json({ message: "Please verify your phone first" });
    }

    const [emailExists, phoneExists, gstExists] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.user.findUnique({ where: { phone } }),
      prisma.operator.findUnique({ where: { gstNo } }),
    ]);
    if (emailExists) {
      return res.status(409).json({ message: "Email already registered" });
    }
    if (phoneExists) {
      return res.status(409).json({ message: "Phone already registered" });
    }
    if (gstExists) {
      return res.status(409).json({ message: "This GST number is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // user aur operator profile EK SAATH banao (ya dono banenge ya dono nahi)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: "OPERATOR", 
        operator: {
          create: { agencyName, gstNo, contactPhone, address },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        operator: true,
      },
    });

   
    await redis.del(verifiedKey(phone));

   
    const token = await issueTokens(user, res);

    return res.status(201).json({
      message: "Operator account created. Your application is under review",
      token,
      user,
    });
  } catch (error) {
    // P2002 = do log ek saath signup kare to yaha aayega
    if (error.code === "P2002") {
      return res.status(409).json({ message: "Email, phone or GST number already registered" });
    }
    console.error("operatorSignup error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ----------  MY PROFILE: GET /operators/me ----------
export const getMyOperator = async (req, res) => {
  try {
    const operator = await prisma.operator.findUnique({ where: { userId: req.user.id } });
    if (!operator) {
      return res.status(404).json({ message: "Operator profile not found" });
    }
    return res.status(200).json({ operator });
  } catch (error) {
    console.error("getMyOperator error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};