import express from "express";
import {
  getOperators,
  getOperatorById,
  approveOperator,
  rejectOperator,
  suspendOperator,
} from "../controllers/admin.controllers.js"; 
import { verifyToken, authorizeRoles } from "../middlewares/auth.middlewares.js"; 

import {
  createCity,
  getAllCities,
  updateCity,
  removeCity,
} from "../controllers/city.controllers.js";

const router = express.Router();



router.get("/operators",verifyToken, authorizeRoles("ADMIN"), getOperators); //  (?status=PENDING)
router.get("/operators/:id",verifyToken, authorizeRoles("ADMIN"), getOperatorById); 
router.patch("/operators/:id/approve", verifyToken, authorizeRoles("ADMIN"),approveOperator);
router.patch("/operators/:id/reject", verifyToken, authorizeRoles("ADMIN"),rejectOperator); 
router.patch("/operators/:id/suspend",verifyToken, authorizeRoles("ADMIN"), suspendOperator); 

router.post("/cities",verifyToken, authorizeRoles("ADMIN"), createCity);
router.get("/cities",verifyToken, authorizeRoles("ADMIN"), getAllCities);
router.patch("/cities/:id",verifyToken, authorizeRoles("ADMIN"), updateCity); 
router.delete("/cities/:id",verifyToken, authorizeRoles("ADMIN"), removeCity); 

export default router;