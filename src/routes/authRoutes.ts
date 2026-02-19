import express, { Router } from "express";

import authController from "../controllers/authController.js";
import authValidation from "../validations/authValidation.js";
import { protect } from "../middleware/auth.js";

const router: Router = express.Router();

// =========================
// Public routes
// =========================

router.post("/register", authValidation.register, authController.register);

router.post("/login", authValidation.login, authController.login);

router.post(
  "/forgot-password",
  authValidation.forgotPassword,
  authController.forgotPassword,
);

router.put(
  "/reset-password/:resetToken",
  authValidation.resetPassword,
  authController.resetPassword,
);

// =========================
// Protected routes
// =========================

router.get("/me", protect, authController.getMe);

router.put(
  "/profile",
  protect,
  authValidation.updateProfile,
  authController.updateProfile,
);

router.put(
  "/change-password",
  protect,
  authValidation.changePassword,
  authController.changePassword,
);

router.post("/logout", protect, authController.logout);

export default router;
