import "dotenv/config"; 
import bcrypt from "bcrypt"; 
import {prisma} from "./config/prismaClient.js"; 


const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const phone = process.env.ADMIN_PHONE;


if (!email || !password || !phone) {
  console.error("ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_PHONE set karo .env me");
  process.exit(1);
}

const hashedPassword = await bcrypt.hash(password, 10); 

// admin pehle se hai to dobara nahi banega 
const admin = await prisma.user.upsert({
  where: { email },
  update: { role: "ADMIN" }, // already hai to bas role ADMIN kar do
  create: { name: "Admin", email, phone, password: hashedPassword, role: "ADMIN" },
});

console.log("Admin ready:", admin.email);
await prisma.$disconnect();