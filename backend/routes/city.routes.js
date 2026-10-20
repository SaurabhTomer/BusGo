import express from "express";
import { getCities } from "../controllers/city.controllers.js";

const router = express.Router();

router.get("/", getCities); 

export default router;