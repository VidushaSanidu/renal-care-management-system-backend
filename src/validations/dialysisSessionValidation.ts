import type { ValidationChain } from "express-validator";
import { body } from "express-validator";

type DialysisSessionValidationType = {
  createSession: ValidationChain[];
  updateSession: ValidationChain[];
  completeSession: ValidationChain[];
};

const dialysisSessionValidation: DialysisSessionValidationType = {
  // Create session validation
  createSession: [
    body("date").isISO8601().withMessage("Valid date is required"),

    body("hdDuration").isNumeric().withMessage("Valid HD duration is required"),

    body("dryWeight").isNumeric().withMessage("Valid dry weight is required"),

    body("preHDDryWeight")
      .isNumeric()
      .withMessage("Valid pre-HD dry weight is required"),

    body("postHDDryWeight")
      .isNumeric()
      .withMessage("Valid post-HD dry weight is required"),

    body("puf").isFloat({ min: 0 }).withMessage("Valid PUF is required"),

    body("auf").isFloat({ min: 0 }).withMessage("Valid AUF is required"),

    body("bloodPressure.systolic")
      .isInt({ min: 50, max: 300 })
      .withMessage("Valid systolic BP is required"),

    body("bloodPressure.diastolic")
      .isInt({ min: 30, max: 200 })
      .withMessage("Valid diastolic BP is required"),

    body("bfr").isNumeric().withMessage("Valid BFR is required"),

    body("tmp").isNumeric().withMessage("Valid TMP is required"),

    body("ap").isNumeric().withMessage("Valid AP is required"),

    body("vp").isNumeric().withMessage("Valid VP is required"),
  ],

  // Update session validation (partial updates allowed)
  updateSession: [
    body("date").optional().isISO8601().withMessage("Valid date is required"),

    body("hdDuration")
      .optional()
      .isNumeric()
      .withMessage("Valid HD duration is required"),

    body("dryWeight")
      .optional()
      .isNumeric()
      .withMessage("Valid dry weight is required"),

    body("preHDDryWeight")
      .optional()
      .isNumeric()
      .withMessage("Valid pre-HD dry weight is required"),

    body("postHDDryWeight")
      .optional()
      .isNumeric()
      .withMessage("Valid post-HD dry weight is required"),

    body("puf")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Valid PUF is required"),

    body("auf")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Valid AUF is required"),

    body("bloodPressure.systolic")
      .optional()
      .isInt({ min: 50, max: 300 })
      .withMessage("Valid systolic BP is required"),

    body("bloodPressure.diastolic")
      .optional()
      .isInt({ min: 30, max: 200 })
      .withMessage("Valid diastolic BP is required"),

    body("bfr").optional().isNumeric().withMessage("Valid BFR is required"),

    body("tmp").optional().isNumeric().withMessage("Valid TMP is required"),

    body("ap").optional().isNumeric().withMessage("Valid AP is required"),

    body("vp").optional().isNumeric().withMessage("Valid VP is required"),
  ],

  // Complete session validation
  completeSession: [
    body("postHDDryWeight")
      .isNumeric()
      .withMessage("Post-HD dry weight is required"),

    body("bloodPressure.systolic")
      .isInt({ min: 50, max: 300 })
      .withMessage("Valid systolic BP is required"),

    body("bloodPressure.diastolic")
      .isInt({ min: 30, max: 200 })
      .withMessage("Valid diastolic BP is required"),
  ],
};

export default dialysisSessionValidation;
