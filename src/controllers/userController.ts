import { Request, Response } from "express";
import { validationResult } from "express-validator";
import userService from "../services/userService.js";

/**
 * Extend Express Request to include authenticated user
 */
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

/**
 * Query params type
 */
interface UserQueryParams {
  page?: string;
  limit?: string;
  role?: string;
  isActive?: string;
  search?: string;
}

class UserController {
  /**
   * @desc Get all users
   */
  async getAllUsers(req: Request, res: Response): Promise<Response> {
    try {
      const queryParams: UserQueryParams = {
        page: req.query.page as string,
        limit: req.query.limit as string,
        role: req.query.role as string,
        isActive: req.query.isActive as string,
        search: req.query.search as string,
      };

      const result = await userService.getAllUsers(queryParams);

      return res.json({
        success: true,
        count: result.users.length,
        total: result.total,
        pagination: {
          page: result.page,
          limit: result.limit,
          pages: result.pages,
        },
        users: result.users,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";

      return res.status(500).json({
        success: false,
        message,
        error: message,
      });
    }
  }

  /**
   * @desc Get user by ID
   */
  async getUserById(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<Response> {
    try {
      userService.checkUserAccess(req.user, req.params.id);

      const user = await userService.getUserById(req.params.id);

      return res.json({
        success: true,
        user,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";

      const statusCode =
        message === "User not found"
          ? 404
          : message.includes("Not authorized")
            ? 403
            : 500;

      return res.status(statusCode).json({
        success: false,
        message,
        error: message,
      });
    }
  }

  /**
   * @desc Create user
   */
  async createUser(req: Request, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const user = await userService.createUser(req.body);

      return res.status(201).json({
        success: true,
        message: "User created successfully",
        user,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";

      return res.status(message === "User already exists" ? 400 : 500).json({
        success: false,
        message,
        error: message,
      });
    }
  }

  /**
   * @desc Update user
   */
  async updateUser(req: Request, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const user = await userService.updateUser(req.params.id, req.body);

      return res.json({
        success: true,
        message: "User updated successfully",
        user,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";

      const statusCode =
        message === "User not found"
          ? 404
          : message === "Email already exists"
            ? 400
            : 500;

      return res.status(statusCode).json({
        success: false,
        message,
        error: message,
      });
    }
  }

  /**
   * @desc Delete user
   */
  async deleteUser(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<Response> {
    try {
      await userService.deleteUser(req.params.id, req.user!.id);

      return res.json({
        success: true,
        message: "User deactivated successfully",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";

      const statusCode = message === "User not found" ? 404 : 400;

      return res.status(statusCode).json({
        success: false,
        message,
        error: message,
      });
    }
  }

  /**
   * @desc Activate user
   */
  async activateUser(req: Request, res: Response): Promise<Response> {
    try {
      const user = await userService.activateUser(req.params.id);

      return res.json({
        success: true,
        message: "User activated successfully",
        user,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";

      return res.status(message === "User not found" ? 404 : 500).json({
        success: false,
        message,
        error: message,
      });
    }
  }

  /**
   * @desc Get users by role
   */
  async getUsersByRole(req: Request, res: Response): Promise<Response> {
    try {
      const users = await userService.getUsersByRole(req.params.role);

      return res.json({
        success: true,
        count: users.length,
        users,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";

      return res.status(message === "Invalid role" ? 400 : 500).json({
        success: false,
        message,
        error: message,
      });
    }
  }

  /**
   * @desc Get user stats
   */
  async getUserStats(req: Request, res: Response): Promise<Response> {
    try {
      const stats = await userService.getUserStats();

      return res.json({
        success: true,
        stats,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";

      return res.status(500).json({
        success: false,
        message,
        error: message,
      });
    }
  }
}

export default new UserController();
