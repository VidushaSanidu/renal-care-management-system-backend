import type { Router } from "express";
import express from "express";

import userController from "../controllers/userController.js";
import userValidation from "../validations/userValidation.js";
import { protect, authorize } from "../middleware/auth.js";

const router: Router = express.Router();

/**
 * Statistics route
 * Must come before parameterized routes
 */
router.get(
  "/stats/overview",
  protect,
  authorize("admin"),
  userController.getUserStats,
);

/**
 * Role-based route
 * Must come before parameterized routes
 */
router.get("/role/:role", protect, userController.getUsersByRole);

/**
 * Get all users
 */
router.get("/", protect, authorize("admin"), userController.getAllUsers);

/**
 * Create user
 */
router.post(
  "/",
  protect,
  authorize("admin"),
  userValidation.createUser,
  userController.createUser,
);

/**
 * Get user by ID
 */
router.get("/:id", protect, userController.getUserById);

/**
 * Update user
 */
router.put(
  "/:id",
  protect,
  authorize("admin"),
  userValidation.updateUser,
  userController.updateUser,
);

/**
 * Delete user
 */
router.delete("/:id", protect, authorize("admin"), userController.deleteUser);

/**
 * Activate user
 */
router.put(
  "/:id/activate",
  protect,
  authorize("admin"),
  userController.activateUser,
);

export default router;
