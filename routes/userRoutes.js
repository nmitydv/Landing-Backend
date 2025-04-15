import express from "express";
import {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
    updateProfile,
    getAllUsers,
    getProfile,
    deleteUser,
    getUserById
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../config/multer.js";

const router = express.Router();

// Register a new user
router.post("/register", registerUser);

// Login a user
router.post("/login", loginUser);

router.get('/allUsers', protect, getAllUsers);

// delete route
router.delete('/deleteUser/:id', protect, deleteUser);

// get user by id 
router.get('/user/:id', protect, getUserById);

export default router;
