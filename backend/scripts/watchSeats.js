// usage: node scripts/watchSeats.js <tripId>
import "dotenv/config";
import { io } from "socket.io-client";

const URL = process.env.TEST_BASE_URL || "http://localhost:8000"; // apna port
const tripId = process.argv[2];
if (!tripId) {
  console.log("Usage: node scripts/watchSeats.js <tripId>");
  process.exit(1);
}

const socket = io(URL);

socket.on("connect", () => {
  console.log("Connected:", socket.id);
  socket.emit("join-trip", tripId); // is trip ke room me aao
});
socket.on("joined", (id) => console.log("Watching trip", id, "... (Ctrl+C to stop)"));
socket.on("seat-update", (data) => {
  console.log(new Date().toLocaleTimeString(), "seat-update ->", data.status, data.seatIds);
});
socket.on("error-message", (m) => console.log("Error:", m));
socket.on("connect_error", (e) => console.log("Connect error:", e.message));