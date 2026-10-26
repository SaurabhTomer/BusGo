import { io } from "socket.io-client";

// seat map kholne par ek socket, band karne par hata do
export function watchTrip(tripId, onSeatUpdate) {
  const socket = io(import.meta.env.VITE_API_URL || undefined, { transports: ["websocket", "polling"] });
  socket.on("connect", () => socket.emit("join-trip", tripId)); // reconnect par bhi dobara join
  socket.on("seat-update", (data) => {
    if (data.tripId === tripId) onSeatUpdate(data);
  });
  return () => {
    socket.emit("leave-trip", tripId);
    socket.disconnect();
  };
}
