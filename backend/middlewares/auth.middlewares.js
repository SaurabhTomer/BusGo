import { verifyToken as verifyJwt } from "../config/jwt.js"; // jwt wala helper (naam alag rakha, takraav na ho)
import { prisma } from "../config/prismaClient.js";

// ---------- verifyToken: access token check karta hai ----------
export const verifyToken = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access token missing" });
  }
  const token = header.split(" ")[1]; 

  try {
    
    const decoded = verifyJwt(token);
    req.user = { id: decoded.id, role: decoded.role };

    next(); 
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ---------- authorizeRoles ----------
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission" });
    }
    next();
  };
};


// ---------- requireApprovedOperato ----------
export const requireApprovedOperator = async (req, res, next) => {
  try {
    const operator = await prisma.operator.findUnique({
      where: { userId: req.user.id },
    });

    if (!operator) {
      return res.status(403).json({ message: "Submit your operator application first" });
    }

    if (operator.status !== "APPROVED") {
      return res.status(403).json({
        message: `Your operator account is ${operator.status.toLowerCase()}`,
        status: operator.status,
      });
    }

    req.operator = operator; 
    next();
  } catch (error) {
    console.error("requireApprovedOperator error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};