import { body, ValidationChain } from "express-validator";

type UserValidationType = {
  createUser: ValidationChain[];
  updateUser: ValidationChain[];
};

const userValidation: UserValidationType = {
  // Create user validation
  createUser: [
    body("name").notEmpty().withMessage("Name is required").trim(),

    body("email")
      .isEmail()
      .withMessage("Please provide a valid email")
      .normalizeEmail(),

    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),

    body("role").isIn(["nurse", "doctor", "admin"]).withMessage("Invalid role"),
  ],

  // Update user validation
  updateUser: [
    body("name")
      .optional()
      .notEmpty()
      .withMessage("Name cannot be empty")
      .trim(),

    body("email")
      .optional()
      .isEmail()
      .withMessage("Please provide a valid email")
      .normalizeEmail(),

    body("role")
      .optional()
      .isIn(["nurse", "doctor", "admin"])
      .withMessage("Invalid role"),
  ],
};

export default userValidation;
