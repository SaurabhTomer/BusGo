import "dotenv/config";
import http from "http";
import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import busRouter from "./routes/bus.routes.js";
import operatorRouter from "./routes/operator.routes.js";
import adminRouter from "./routes/admin.routes.js";
import router from "./routes/city.routes.js";
import routeRouter from "./routes/route.routes.js";
import TripRouter from "./routes/trip.routes.js";
import searchRouter from "./routes/search.routes.js";
import bookingRouter from "./routes/booking.routes.js";
import paymentRouter from "./routes/payment.routes.js";
import { razorpayWebhook } from "./controllers/payment.controllers.js";
import { startExpiryJob } from "./jobs/expireBookings.js";
import { initSocket } from "./config/socket.js";
import helmet from "helmet";
import cors from "cors";
import { globalLimiter } from "./middlewares/rateLimiters.js";

const app = express();

// production me proxy (Render/Nginx) ke peeche asli user ka IP dekhne ke liye
if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);

app.use(helmet()); 

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true, 
  })
);

const port = process.env.PORT || 5000;

// webhook SABSE PEHLE, express.json() se upar (isko raw body chahiye)
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), razorpayWebhook);

app.use(express.json());
app.use(cookieParser());

app.use("/api", globalLimiter);

// ------ Routes ------
app.use("/api/auth", authRouter);
app.use("/api/buses", busRouter);
app.use("/api/operators", operatorRouter);
app.use("/api/admin", adminRouter);
app.use("/api/cities", router);
app.use("/api/routes", routeRouter);
app.use("/api/trips", TripRouter);
app.use("/api/search", searchRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/payments", paymentRouter);

// express app ko http server me lapeta, socket usi pe chalega
const server = http.createServer(app);
initSocket(server);

// app.listen NAHI, server.listen
server.listen(port, () => {
  console.log(`server running at port ${port}`);
  startExpiryJob();
});