import {prisma} from "../config/prismaClient.js"; 
import { releaseSeats } from "../utils/seatLock.js";

// ek baar chalne par: expired PENDING bookings ko EXPIRED karo aur seats free karo
export const expireBookings = async () => {
  try {
    // jinka 5 min ka time khatam ho gaya
    const expired = await prisma.booking.findMany({
      where: { status: "PENDING", expiresAt: { lt: new Date() } },
      include: { seats: true },
    });

    for (const booking of expired) {
      // status: "PENDING" where me isliye, ki agar isi waqt payment confirm ho gayi
      // to ye update 0 rows karega aur hum us booking ko chhod denge (race se bachav)
      const changed = await prisma.booking.updateMany({
        where: { id: booking.id, status: "PENDING" },
        data: { status: "EXPIRED" },
      });
      if (changed.count === 0) continue;

      // seats DB se hatao (warna unique ki wajah se kabhi free nahi hongi)
      await prisma.bookingSeat.deleteMany({ where: { bookingId: booking.id } });

      // Redis lock bhi chhodo
      await releaseSeats(booking.tripId, booking.seats.map((s) => s.seatId), booking.userId);

      console.log(`Booking ${booking.id} expired, seats released`);
    }
  } catch (error) {
    console.error("expireBookings error:", error);
  }
};

// har 60 second me chalao
export const startExpiryJob = () => {
  setInterval(expireBookings, 60 * 1000);
  console.log("Booking expiry job started");
};