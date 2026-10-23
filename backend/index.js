import express from 'express'
import authRouter from './routes/auth.routes.js';
import cookieParser from 'cookie-parser';
import busRouter from './routes/bus.routes.js';
import operatorRouter from './routes/operator.routes.js';
import adminRouter from './routes/admin.routes.js';
import router from './routes/city.routes.js';
import routeRouter from './routes/route.routes.js';
import TripRouter from './routes/trip.routes.js';

const app = express();

const port = process.env.PORT || 5000 ;


app.use(express.json());
app.use(cookieParser())


// ------Routes---------
app.use("/api/auth" , authRouter);
app.use("/api/buses", busRouter);
app.use("/api/operators", operatorRouter);
app.use("/api/admin", adminRouter);
app.use("/api/cities", router);
app.use("/api/routes", routeRouter);
app.use("/api/trips", TripRouter);

app.listen(port , () => {
    console.log(`server running at port ${port}`)
})