import { body } from "express-validator";
import { Request, Response, NextFunction } from "express";

/**
 * Validation middleware for Hemoglobin prediction
 */
export const validateHbPrediction = [
  body("age")
    .isNumeric()
    .withMessage("Age must be a number")
    .isFloat({ min: 0, max: 120 })
    .withMessage("Age must be between 0 and 120"),

  body("gender").custom((value: unknown) => {
    const validGenders = ["Male", "Female", "M", "F", 0, 1, "0", "1"];

    if (!validGenders.includes(value as string | number)) {
      throw new Error("Gender must be Male, Female, M, F, 0, or 1");
    }

    return true;
  }),

  body("dialysis_duration_months")
    .isNumeric()
    .withMessage("Dialysis duration must be a number")
    .isFloat({ min: 0 })
    .withMessage("Dialysis duration must be non-negative"),

  body("dry_weight")
    .isNumeric()
    .withMessage("Dry weight must be a number")
    .isFloat({ min: 0.1 })
    .withMessage("Dry weight must be greater than 0"),

  body("pre_dialysis_weight")
    .isNumeric()
    .withMessage("Pre-dialysis weight must be a number")
    .isFloat({ min: 0.1 })
    .withMessage("Pre-dialysis weight must be greater than 0"),

  body("post_dialysis_weight")
    .isNumeric()
    .withMessage("Post-dialysis weight must be a number")
    .isFloat({ min: 0.1 })
    .withMessage("Post-dialysis weight must be greater than 0"),
];

/**
 * Validate patient ID param
 */
export const validatePatientIdParam = (
  req: Request,
  res: Response,
  next: NextFunction,
): Response | void => {
  const patientId = req.params.patientId as string;

  if (!patientId || patientId.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Patient ID is required",
    });
  }

  if (!/^[A-Za-z0-9_-]+$/.test(patientId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid patient ID format",
    });
  }

  next();
};

/**
 * Validate logical weight relationships
 */
export const validateWeightLogic = (
  req: Request,
  res: Response,
  next: NextFunction,
): Response | void => {
  const dryWeight = Number(req.body.dry_weight);
  const preWeight = Number(req.body.pre_dialysis_weight);
  const postWeight = Number(req.body.post_dialysis_weight);

  if (dryWeight && preWeight && postWeight) {
    // Post should not exceed pre
    if (postWeight > preWeight) {
      return res.status(400).json({
        success: false,
        message:
          "Post-dialysis weight should be less than or equal to pre-dialysis weight",
      });
    }

    // Check realistic ranges
    if (preWeight < dryWeight * 0.8 || preWeight > dryWeight * 1.5) {
      return res.status(400).json({
        success: false,
        message: "Pre-dialysis weight unrealistic compared to dry weight",
      });
    }

    if (postWeight < dryWeight * 0.8 || postWeight > dryWeight * 1.3) {
      return res.status(400).json({
        success: false,
        message: "Post-dialysis weight unrealistic compared to dry weight",
      });
    }
  }

  next();
};
