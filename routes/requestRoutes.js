import express from "express";
import {
  getAllRequests,
  addRequest,
  deleteRequest,
  filterRequests,
} from "../controllers/requestController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all requests (protected)
router.get("/requests", protect, getAllRequests);

// Add a new request
router.post("/createRequests", addRequest);

// Delete a request by ID
router.delete("/deleteRequests/:id", protect, deleteRequest);

// Filter requests by date and classStandard (10th, 12th)
router.get("/filter/search", protect, filterRequests);

export default router;
