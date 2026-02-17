const { body } = require("express-validator");

const userValidation = {
  // Create user validation
  createUser: [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role").isIn(["nurse", "doctor", "admin"]).withMessage("Invalid role"),
  ],

  // Update user validation
  updateUser: [
    body("name").optional().notEmpty().withMessage("Name cannot be empty"),
    body("email")
      .optional()
      .isEmail()
      .withMessage("Please provide a valid email"),
    body("role")
      .optional()
      .isIn(["nurse", "doctor", "admin"])
      .withMessage("Invalid role"),
  ],
};

module.exports = userValidation;
