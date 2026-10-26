import express from "express";
import { getTripSeats, searchTrips } from "../controllers/search.controllers.js"; 
import { searchLimiter } from "../middlewares/rateLimiters.js";

const searchRouter = express.Router();

// public
searchRouter.get("/trips", searchLimiter,searchTrips);
searchRouter.get("/trips/:id/seats",searchLimiter, getTripSeats); // seat map, public

export default searchRouter;