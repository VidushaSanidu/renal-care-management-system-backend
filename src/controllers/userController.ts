import type { Request, Response } from "express";
import { validationResult } from "express-validator";

import userService from "../services/userService.js";
import { validUserRoles, type UserRole } from "../models/User.js";

class UserController {
  /**
   * @desc Get all users
   */
  async getAllUsers(req: Request, res: Response): Promise<Response> {
    try {
      const queryParams = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        role: req.query.role as UserRole | undefined,
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
  async getUserById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params as { id: string };
      const user = await userService.getUserById(id);

      userService.checkUserAccess(user, id);
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

      const { id } = req.params as { id: string };

      const user = await userService.updateUser(id, req.body);

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
  async deleteUser(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params as { id: string };
      await userService.deleteUser(id, req.user!.id);

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
      const { id } = req.params as { id: string };
      const user = await userService.activateUser(id);

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
      const { role } = req.params as { role: UserRole };

      if (!validUserRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role",
        });
      }
      const users = await userService.getUsersByRole(role);

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
