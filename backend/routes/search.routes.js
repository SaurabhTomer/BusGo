import express from "express";
import { getTripSeats, searchTrips } from "../controllers/search.controllers.js"; 

const searchRouter = express.Router();

// public
searchRouter.get("/trips", searchTrips);
searchRouter.get("/trips/:id/seats", getTripSeats); // seat map, public

export default searchRouter;