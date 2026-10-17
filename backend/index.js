import express from 'express'
import authRouter from './routes/auth.routes.js';

const app = express();

const port = process.env.PORT || 5000 ;


app.use(express.json());


// ------Routes---------
app.use("/api/auth" , authRouter);


app.listen(port , () => {
    console.log(`server running at port ${port}`)
})