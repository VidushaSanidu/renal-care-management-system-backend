import { Request, Response } from "express";
import { validationResult } from "express-validator";
import authService from "../services/authService.js";

/**
 * Extend Express Request to include authenticated user
 */
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role?: string;
  };
}

class AuthController {
  /**
   * @desc Register user
   * @route POST /api/auth/register
   */
  async register(req: Request, res: Response): Promise<Response> {
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

      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        ...result,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Registration failed";

      return res.status(400).json({
        success: false,
        message,
      });
    }
  }

  /**
   * @desc Login user
   * @route POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<Response> {
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

      return res.json({
        success: true,
        message: "Login successful",
        ...result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";

      return res.status(401).json({
        success: false,
        message,
      });
    }
  }

  /**
   * @desc Get current user
   * @route GET /api/auth/me
   */
  async getMe(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const user = await authService.getUserById(userId);

      return res.json({
        success: true,
        user,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";

      return res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * @desc Update profile
   */
  async updateProfile(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<Response> {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const user = await authService.updateUserProfile(userId, req.body);

      return res.json({
        success: true,
        message: "Profile updated successfully",
        user,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Update failed";

      return res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * @desc Change password
   */
  async changePassword(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<Response> {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { currentPassword, newPassword } = req.body;

      await authService.changePassword(userId, currentPassword, newPassword);

      return res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Password change failed";

      return res.status(400).json({
        success: false,
        message,
      });
    }
  }

  /**
   * @desc Forgot password
   */
  async forgotPassword(req: Request, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { email } = req.body;

      const result = await authService.generateResetToken(email);

      return res.json({
        success: true,
        message: result.message,
        resetToken: result.resetToken, // remove in production
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed";

      return res.status(404).json({
        success: false,
        message,
      });
    }
  }

  /**
   * @desc Reset password
   */
  async resetPassword(req: Request, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { password } = req.body;
      const { resetToken } = req.params;

      await authService.resetPassword(resetToken, password);

      return res.json({
        success: true,
        message: "Password reset successful",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Reset failed";

      return res.status(400).json({
        success: false,
        message,
      });
    }
  }

  /**
   * @desc Logout
   */
  async logout(req: Request, res: Response): Promise<Response> {
    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  }
}

export default new AuthController();
