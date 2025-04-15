import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import cloudinary from '../config/cloudinary.js';


dotenv.config();

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// User Sign-Up
export const registerUser = async (req, res) => {
    const { name, email, password, confirmPassword, mobile } = req.body;

    try {
        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const user = await User.create({
            name,
            email,
            password,
            mobile,
        });

        if (user) {
            res.status(201).json({
                message: "User registered successfully",
                user: { _id: user._id, name: user.name, email: user.email, mobile: user.mobile },
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: "User registration failed" });
        }
    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// User Login
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
      // if (!email || !password) {
      //     return res.status(400).json({ message: "Email and password are required" });
      // }

      const user = await User.findOne({ email });

      if (!user) {
          return res.status(404).json({ message: "User not found" });
      }

      const isMatch = await user.matchPassword(password);

      if (!isMatch) {
          return res.status(400).json({ message: "Invalid credentials" });
      }

      res.json({
          message: "Login successful",
          user: { 
              _id: user._id,
              name: user.name,
              email: user.email,
              mobile: user.mobile,
              role: user.role // Added role here
          },
          token: generateToken(user._id),
      });
  } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
  }
};




// Forgot Password
export const forgotPassword = async (req, res) => {
    const { email } = req.body;
  
    try {
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
  
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });
  
      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      await user.save();
  
      const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
  
      const mailOptions = {
        from: `"Support" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Password Reset Request",
        html: `
          <p>Hi ${user.name || "there"},</p>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <a href="${resetUrl}" target="_blank">${resetUrl}</a>
          <p>This link is valid for 1 hour.</p>
        `,
      };
  
      await transporter.sendMail(mailOptions);
  
      res.json({ message: "Password reset link sent to your email." });
  
    } catch (error) {
      console.error("Error in forgotPassword:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  };


// Reset Password
export const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    try {
        if (!password || !confirmPassword) {
            return res.status(400).json({ message: "Both password fields are required" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        // Hash the token and find user
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        // Update password and clear reset fields
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.json({ message: "Password reset successful. You can now log in." });

    } catch (error) {
        console.error("Error in resetPassword:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Get the logged-in user's profile
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// Update user profile

export const updateProfile = async (req, res) => {
  try {
    const { name, email, mobileNumber, role } = req.body;
    const { userId } = req.params;

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Upload image if file is sent via multer
    if (req.file) {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'profile_images',
          public_id: `${userId}_profile`,
          overwrite: true,
          resource_type: 'image',
        },
        async (error, result) => {
          if (error) {
            return res.status(400).json({
              success: false,
              message: 'Image upload failed',
              error,
            });
          }

          // Update user's image
          user.profileImage = result.secure_url;

          // Update other fields
          if (name) user.name = name;
          if (email) user.email = email;
          if (mobileNumber) user.mobileNumber = mobileNumber;
          if (role) user.role = role;

          await user.save();

          return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user,
          });
        }
      );

      // Pipe the buffer to Cloudinary
      stream.end(req.file.buffer);
    } else {
      // Update fields without image
      if (name) user.name = name;
      if (email) user.email = email;
      if (mobileNumber) user.mobileNumber = mobileNumber;
      if (role) user.role = role;

      await user.save();

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user,
      });
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};


// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) return res.status(404).json({ message: "User not found" });

    await user.deleteOne();
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete User Error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Get All User's
export const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;       // Default to page 1
        const limit = parseInt(req.query.limit) || 10;    // Default to 10 users per page
        const skip = (page - 1) * limit;

        const totalUsers = await User.countDocuments();
        const users = await User.find()
            .select('-password')
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit),
            totalUsers,
            users
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};
// Get User by ID
export const getUserById = async (req, res) => {
  try {
      const { id } = req.params; // Get the user ID from the route parameters

      // Find the user by ID, excluding the password field
      const user = await User.findById(id).select('-password');

      // If user not found, return an error response
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({
          success: true,
          user
      });
  } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: 'Server Error' });
  }
};
