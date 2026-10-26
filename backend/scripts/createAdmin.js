import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../config/prismaClient.js";

// yahan apni admin details likho
const ADMIN = {
  name: "BusGo Admin",
  email: "admin@busgo.com",
  phone: "9999999999", // 10 digit, unique hona chahiye
  password: "Admin@12345",
};

const run = async () => {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN.email } });
  if (existing) {
    // user pehle se hai to sirf role ADMIN kar do
    await prisma.user.update({ where: { id: existing.id }, data: { role: "ADMIN" } });
    console.log("Existing user is now ADMIN:", ADMIN.email);
    return;
  }

  const user = await prisma.user.create({
    data: {
      name: ADMIN.name,
      email: ADMIN.email,
      phone: ADMIN.phone,
      password: await bcrypt.hash(ADMIN.password, 10),
      role: "ADMIN",
    },
  });
  console.log("Admin created:", user.email);
};

run()
  .catch((e) => console.error("createAdmin error:", e))
  .finally(() => prisma.$disconnect().then(() => process.exit(0)));