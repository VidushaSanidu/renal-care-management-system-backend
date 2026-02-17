const { validationResult } = require("express-validator");
const userService = require("../services/userService");

class UserController {
  // @desc    Get all users
  // @route   GET /api/users
  // @access  Private/Admin
  async getAllUsers(req, res) {
    try {
      const queryParams = {
        page: req.query.page,
        limit: req.query.limit,
        role: req.query.role,
        isActive: req.query.isActive,
        search: req.query.search,
      };

      const result = await userService.getAllUsers(queryParams);

      res.json({
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
      res.status(500).json({
        success: false,
        message: error.message || "Server error",
        error: error.message,
      });
    }
  }

  // @desc    Get user by ID
  // @route   GET /api/users/:id
  // @access  Private/Admin or own profile
  async getUserById(req, res) {
    try {
      // Check access permissions
      userService.checkUserAccess(req.user, req.params.id);

      const user = await userService.getUserById(req.params.id);

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      const statusCode =
        error.message === "User not found"
          ? 404
          : error.message.includes("Not authorized")
            ? 403
            : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || "Server error",
        error: error.message,
      });
    }
  }

  // @desc    Create user
  // @route   POST /api/users
  // @access  Private/Admin
  async createUser(req, res) {
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

      res.status(201).json({
        success: true,
        message: "User created successfully",
        user,
      });
    } catch (error) {
      res.status(error.message === "User already exists" ? 400 : 500).json({
        success: false,
        message: error.message || "Server error",
        error: error.message,
      });
    }
  }

  // @desc    Update user
  // @route   PUT /api/users/:id
  // @access  Private/Admin
  async updateUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const user = await userService.updateUser(req.params.id, req.body);

      res.json({
        success: true,
        message: "User updated successfully",
        user,
      });
    } catch (error) {
      const statusCode =
        error.message === "User not found"
          ? 404
          : error.message === "Email already exists"
            ? 400
            : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || "Server error",
        error: error.message,
      });
    }
  }

  // @desc    Delete user
  // @route   DELETE /api/users/:id
  // @access  Private/Admin
  async deleteUser(req, res) {
    try {
      await userService.deleteUser(req.params.id, req.user.id);

      res.json({
        success: true,
        message: "User deactivated successfully",
      });
    } catch (error) {
      const statusCode = error.message === "User not found" ? 404 : 400;

      res.status(statusCode).json({
        success: false,
        message: error.message || "Server error",
        error: error.message,
      });
    }
  }

  // @desc    Activate user
  // @route   PUT /api/users/:id/activate
  // @access  Private/Admin
  async activateUser(req, res) {
    try {
      const user = await userService.activateUser(req.params.id);

      res.json({
        success: true,
        message: "User activated successfully",
        user,
      });
    } catch (error) {
      res.status(error.message === "User not found" ? 404 : 500).json({
        success: false,
        message: error.message || "Server error",
        error: error.message,
      });
    }
  }

  // @desc    Get users by role
  // @route   GET /api/users/role/:role
  // @access  Private
  async getUsersByRole(req, res) {
    try {
      const { role } = req.params;
      const users = await userService.getUsersByRole(role);

      res.json({
        success: true,
        count: users.length,
        users,
      });
    } catch (error) {
      res.status(error.message === "Invalid role" ? 400 : 500).json({
        success: false,
        message: error.message || "Server error",
        error: error.message,
      });
    }
  }

  // @desc    Get user statistics
  // @route   GET /api/users/stats/overview
  // @access  Private/Admin
  async getUserStats(req, res) {
    try {
      const stats = await userService.getUserStats();

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Server error",
        error: error.message,
      });
    }
  }
}

module.exports = new UserController();
