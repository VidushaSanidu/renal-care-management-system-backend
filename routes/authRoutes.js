const express = require("express");
const authController = require("../controllers/authController");
const authValidation = require("../validations/authValidation");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Public routes
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

// Protected routes
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

module.exports = router;
