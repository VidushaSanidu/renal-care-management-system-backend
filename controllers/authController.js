const { validationResult } = require("express-validator");
const authService = require("../services/authService");

class AuthController {
  // @desc    Register user
  // @route   POST /api/auth/register
  // @access  Public (Admin only in real scenario)
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const result = await authService.registerUser(req.body);

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        ...result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || "Server error during registration",
        error: error.message,
      });
    }
  }

  // @desc    Login user
  // @route   POST /api/auth/login
  // @access  Public
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;
      const result = await authService.loginUser(email, password);

      res.json({
        success: true,
        message: "Login successful",
        ...result,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message || "Server error during login",
        error: error.message,
      });
    }
  }

  // @desc    Get current user
  // @route   GET /api/auth/me
  // @access  Private
  async getMe(req, res) {
    try {
      const user = await authService.getUserById(req.user.id);

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Server error",
        error: error.message,
      });
    }
  }

  // @desc    Update user profile
  // @route   PUT /api/auth/profile
  // @access  Private
  async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const user = await authService.updateUserProfile(req.user.id, req.body);

      res.json({
        success: true,
        message: "Profile updated successfully",
        user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Server error",
        error: error.message,
      });
    }
  }

  // @desc    Change password
  // @route   PUT /api/auth/change-password
  // @access  Private
  async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(
        req.user.id,
        currentPassword,
        newPassword,
      );

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || "Server error",
        error: error.message,
      });
    }
  }

  // @desc    Forgot password
  // @route   POST /api/auth/forgot-password
  // @access  Public
  async forgotPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { email } = req.body;
      const result = await authService.generateResetToken(email);

      // In a real application, you would send an email here
      // For now, we'll just return the token (DO NOT do this in production!)
      res.json({
        success: true,
        message: result.message,
        resetToken: result.resetToken, // Remove this in production
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message || "Server error",
        error: error.message,
      });
    }
  }

  // @desc    Reset password
  // @route   PUT /api/auth/reset-password/:resetToken
  // @access  Public
  async resetPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { password } = req.body;
      const { resetToken } = req.params;

      await authService.resetPassword(resetToken, password);

      res.json({
        success: true,
        message: "Password reset successful",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || "Server error",
        error: error.message,
      });
    }
  }

  // @desc    Logout user
  // @route   POST /api/auth/logout
  // @access  Private
  async logout(req, res) {
    try {
      // In a real application, you might want to blacklist the token
      // For now, we'll just return success
      res.json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
}

module.exports = new AuthController();
