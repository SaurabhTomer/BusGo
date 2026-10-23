import express from "express";
import { searchTrips } from "../controllers/search.controllers.js"; 

const searchRouter = express.Router();

// public
searchRouter.get("/trips", searchTrips);

export default searchRouter;