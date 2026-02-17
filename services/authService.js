const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");

class AuthService {
  // Generate JWT token
  generateToken(user) {
    return jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRE,
      },
    );
  }

  // Register new user
  async registerUser(userData) {
    const {
      name,
      email,
      password,
      role,
      phoneNumber,
      department,
      licenseNumber,
      specialization,
    } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("User already exists");
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      phoneNumber,
      department,
      licenseNumber,
      specialization,
    });

    // Generate token
    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        department: user.department,
      },
    };
  }

  // Login user
  async loginUser(email, password) {
    // Find user and include password
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error("Account is deactivated");
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        department: user.department,
        lastLogin: user.lastLogin,
      },
    };
  }

  // Get user by ID
  async getUserById(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber,
      department: user.department,
      licenseNumber: user.licenseNumber,
      specialization: user.specialization,
      shift: user.shift,
      profilePicture: user.profilePicture,
      lastLogin: user.lastLogin,
      emailVerified: user.emailVerified,
      notifications: user.notifications,
      createdAt: user.createdAt,
    };
  }

  // Update user profile
  async updateUserProfile(userId, updates) {
    const allowedFields = [
      "name",
      "phoneNumber",
      "department",
      "shift",
      "notifications",
    ];
    const filteredUpdates = {};

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });

    const user = await User.findByIdAndUpdate(userId, filteredUpdates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber,
      department: user.department,
      shift: user.shift,
      notifications: user.notifications,
    };
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select("+password");

    if (!user) {
      throw new Error("User not found");
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new Error("Current password is incorrect");
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return { message: "Password changed successfully" };
  }

  // Generate password reset token
  async generateResetToken(email) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    return { resetToken, message: "Reset token generated" };
  }

  // Reset password with token
  async resetPassword(resetToken, newPassword) {
    // Get hashed token
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      throw new Error("Invalid or expired token");
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return { message: "Password reset successful" };
  }
}

module.exports = new AuthService();
