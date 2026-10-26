import "dotenv/config";
import { prisma } from "../config/prismaClient.js";

for (let i = 0; i < 4; i++) {
  const t = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  console.log(`query ${i + 1}: ${Date.now() - t} ms`);
}
process.exit(0);