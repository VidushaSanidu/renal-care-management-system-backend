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
  authorize("ADMIN"),
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
router.get("/", protect, authorize("ADMIN"), userController.getAllUsers);

/**
 * Create user
 */
router.post(
  "/",
  protect,
  authorize("ADMIN"),
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
  authorize("ADMIN"),
  userValidation.updateUser,
  userController.updateUser,
);

/**
 * Delete user
 */
router.delete("/:id", protect, authorize("ADMIN"), userController.deleteUser);

/**
 * Activate user
 */
router.put(
  "/:id/activate",
  protect,
  authorize("ADMIN"),
  userController.activateUser,
);

export default router;
