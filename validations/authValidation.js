const { body } = require("express-validator");

const authValidation = {
  // Register validation
  register: [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role").isIn(["NURSE", "DOCTOR", "ADMIN"]).withMessage("Invalid role"),
  ],

  // Login validation
  login: [
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],

  // Profile update validation
  updateProfile: [
    body("name").optional().notEmpty().withMessage("Name cannot be empty"),
    body("phoneNumber")
      .optional()
      .notEmpty()
      .withMessage("Phone number cannot be empty"),
    body("department")
      .optional()
      .notEmpty()
      .withMessage("Department cannot be empty"),
  ],

  // Change password validation
  changePassword: [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
  ],

  // Forgot password validation
  forgotPassword: [
    body("email").isEmail().withMessage("Please provide a valid email"),
  ],

  // Reset password validation
  resetPassword: [
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
};

module.exports = authValidation;
