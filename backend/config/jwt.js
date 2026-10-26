import fs from "fs"; 
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken"; 

// ES module me __dirname nahi hota, isliye ye tareeka
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// dono keys file se padh lo (server start pe ek baar)
// const privateKey = fs.readFileSync(path.join(__dirname, "../keys/private.pem"), "utf8");
// const publicKey = fs.readFileSync(path.join(__dirname, "../keys/public.pem"), "utf8");
const privateKey = process.env.JWT_PRIVATE_KEY
  ? process.env.JWT_PRIVATE_KEY.replace(/\\n/g, "\n")
  : fs.readFileSync(path.join(__dirname, "../keys/private.pem"), "utf8");

const publicKey = process.env.JWT_PUBLIC_KEY
  ? process.env.JWT_PUBLIC_KEY.replace(/\\n/g, "\n")
  : fs.readFileSync(path.join(__dirname, "../keys/public.pem"), "utf8");


export const signToken = (payload) => {         // sign token with private key
  return jwt.sign(payload, privateKey, {
    algorithm: "RS256", 
    expiresIn: "7d", 
  });
};


export const verifyToken = (token) => {         //verify token with public key
  return jwt.verify(token, publicKey, {
    algorithms: ["RS256"], 
  });
};