// usage: node scripts/concurrencyTest.js <tripId>
import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../config/prismaClient.js";
import redis from "../config/redis.js";

const BASE = process.env.TEST_BASE_URL || "http://localhost:8000"; 
const USERS = 50;
const tripId = process.argv[2];
if (!tripId) {
  console.log("Usage: node scripts/concurrencyTest.js <tripId>");
  process.exit(1);
}

let failed = 0;
const check = (name, ok, extra = "") => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name} ${ok ? "" : extra}`);
  if (!ok) failed++;
};

// 50 test users banao (pehle se hain to wahi)
const setupUsers = async () => {
  const hash = await bcrypt.hash("12345678", 10);
  const rows = Array.from({ length: USERS }, (_, i) => ({
    name: `Load Test ${i}`,
    email: `loadtest${i}@busgo.test`,
    phone: `9000000${String(i).padStart(3, "0")}`,
    password: hash,
  }));
  await prisma.user.createMany({ data: rows, skipDuplicates: true });
  return prisma.user.findMany({
    where: { email: { startsWith: "loadtest", endsWith: "@busgo.test" } },
    select: { id: true, email: true },
  });
};

// sab login karke token lo
const loginAll = (users) =>
  Promise.all(
    users.map(async (u) => {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: u.email, password: "12345678" }),
      });
      const data = await res.json();
      return { ...u, token: data.token };
    })
  );

// test ke baad safai
const cleanBookings = async (users, seatIds) => {
  await prisma.booking.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  for (const seatId of seatIds) await redis.del(`seat-lock:${tripId}:${seatId}`);
};

// ek booking request
const book = async (user, seatIds) => {
  const res = await fetch(`${BASE}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
    body: JSON.stringify({ tripId, seatIds }),
  });
  return res.status;
};

const countStatuses = (list) => {
  const out = {};
  for (const s of list) out[s] = (out[s] || 0) + 1;
  return out;
};

const run = async () => {
  const seatsRes = await fetch(`${BASE}/api/search/trips/${tripId}/seats`);
  const free = (await seatsRes.json()).seats.filter((s) => s.status === "AVAILABLE");
  if (free.length < 3) return console.log("Trip me kam se kam 3 free seats chahiye");
  const [A, B, C] = free.map((s) => s.id);

  console.log(`\nSetup: ${USERS} users bana rahe hain aur login...`);
  const users = await loginAll(await setupUsers());
  check("sab users login hue", users.every((u) => u.token));

  // TEST 1: 50 log, ek hi seat
  console.log(`\n[1] ${USERS} users, ek hi seat, ek saath`);
  let t0 = Date.now();
  let statuses = await Promise.all(users.map((u) => book(u, [A])));
  console.log(`    time: ${Date.now() - t0} ms ->`, countStatuses(statuses));
  check("exactly 1 ko 201", statuses.filter((s) => s === 201).length === 1);
  check(`baaki ${USERS - 1} ko 409`, statuses.filter((s) => s === 409).length === USERS - 1);
  const rows1 = await prisma.bookingSeat.count({ where: { tripId, seatId: A } });
  check("DB me us seat ki sirf 1 row", rows1 === 1, `rows=${rows1}`);
  await cleanBookings(users, [A]);

  // TEST 2: ulte order me do seats
  console.log(`\n[2] 25 users [B,C] aur 25 users [C,B], ek saath`);
  t0 = Date.now();
  statuses = await Promise.all(users.map((u, i) => book(u, i % 2 === 0 ? [B, C] : [C, B])));
  console.log(`    time: ${Date.now() - t0} ms ->`, countStatuses(statuses));
  check("exactly 1 ko 201", statuses.filter((s) => s === 201).length === 1);
  const rows2 = await prisma.bookingSeat.count({ where: { tripId, seatId: { in: [B, C] } } });
  check("DB me B aur C ki total 2 rows", rows2 === 2, `rows=${rows2}`);
  await cleanBookings(users, [B, C]);

  // TEST 3: har user alag seat
  const need = Math.min(free.length, USERS);
  console.log(`\n[3] ${need} users, har ek alag seat, ek saath`);
  const ids = free.slice(0, need).map((s) => s.id);
  statuses = await Promise.all(ids.map((seatId, i) => book(users[i], [seatId])));
  console.log("    ->", countStatuses(statuses));
  check("sab ko 201", statuses.every((s) => s === 201));
  await cleanBookings(users, ids);
};

try {
  await run();
} catch (error) {
  console.error("Script error:", error.message);
  failed++;
}

console.log(failed ? `\n${failed} check FAIL` : "\nSab checks PASS");
await prisma.$disconnect();
redis.disconnect();
process.exit(failed ? 1 : 0);