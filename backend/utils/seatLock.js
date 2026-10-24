import redis from "../config/redis.js";

const LOCK_SECONDS = 300; 


const lockKey = (tripId, seatId) => `seat-lock:${tripId}:${seatId}`;

//  key ka owner wahi ho tabhi delete (dusre ka lock galti se na hate)
const RELEASE_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
else
  return 0
end`;

// sab seats lock karo. Ek bhi fail hui to jo lock ki thi wapas chhod do
export const lockSeats = async (tripId, seatIds, userId) => {
  const locked = [];
  for (const seatId of seatIds) {
    // NX = sirf tab set ho jab key pehle se na ho
    const ok = await redis.set(lockKey(tripId, seatId), userId, "EX", LOCK_SECONDS, "NX");
    if (!ok) {
      await releaseSeats(tripId, locked, userId); // rollback
      return false;
    }
    locked.push(seatId);
  }
  return true;
};

// seats ka lock chhodo 
export const releaseSeats = async (tripId, seatIds, userId) => {
  for (const seatId of seatIds) {
    await redis.eval(RELEASE_SCRIPT, 1, lockKey(tripId, seatId), userId);
  }
};

// kaun si seats abhi locked hain (seat map ke liye), ek hi call me
export const getLockedSeatIds = async (tripId, seatIds) => {
  if (seatIds.length === 0) return new Set();
  const values = await redis.mget(seatIds.map((id) => lockKey(tripId, id)));
  return new Set(seatIds.filter((_, i) => values[i] !== null));
};