import express from 'express'
import authRouter from './routes/auth.routes.js';
import cookieParser from 'cookie-parser';
import busRouter from './routes/bus.routes.js';
import operatorRouter from './routes/operator.routes.js';

const app = express();

const port = process.env.PORT || 5000 ;


app.use(express.json());
app.use(cookieParser())


// ------Routes---------
app.use("/api/auth" , authRouter);
app.use("/api/buses", busRouter);
app.use("/api/operators", operatorRouter);


app.listen(port , () => {
    console.log(`server running at port ${port}`)
})