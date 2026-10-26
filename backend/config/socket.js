import { Server } from "socket.io";
import { z } from "zod";

// io = socket server. initSocket chalne ke baad isme bharta hai
let io = null;

// tripId sahi uuid hai ya nahi dekhne ke liye
const tripIdSchema = z.uuid();

// ---------- Socket server chalu karna (index.js me ek baar) ----------
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL , credentials:true }, 
  });

  io.on("connection", (socket) => {
    // frontend seat map kholta hai to us trip ke "room" me aa jata hai
    socket.on("join-trip", (tripId) => {
      if (!tripIdSchema.safeParse(tripId).success) {
        return socket.emit("error-message", "Invalid tripId");
      }
      socket.join(`trip:${tripId}`);
      socket.emit("joined", tripId); // confirm
    });

    // seat map band karta hai to room chhod deta hai
    socket.on("leave-trip", (tripId) => {
      socket.leave(`trip:${tripId}`);
    });
  });

  console.log("Socket.io started");
  return io;
};

// ---------- Seat ka status badla, room me sabko batao ----------
// status: "HELD" | "BOOKED" | "AVAILABLE"
// io chalu nahi hai to chupchap kuch nahi karta, app nahi tootti
export const emitSeatUpdate = (tripId, seatIds, status) => {
  if (!io || !seatIds || seatIds.length === 0) return;
  io.to(`trip:${tripId}`).emit("seat-update", { tripId, seatIds, status });
};