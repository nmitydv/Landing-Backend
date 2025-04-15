import express from "express";
import {
  registerAdmin,
  loginAdmin,
} from "../controllers/adminController.js"; 
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Register a new admin
router.post("/register", registerAdmin);

// Login an admin
router.post("/login", loginAdmin);

export default router;
