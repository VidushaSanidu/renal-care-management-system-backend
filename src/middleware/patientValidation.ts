import { body } from "express-validator";
import type { Request, Response, NextFunction } from "express";

/**
 * Validation for creating patient
 */
export const validateCreatePatient = [
  body("patientId").notEmpty().withMessage("Patient ID is required"),

  body("name").notEmpty().withMessage("Patient name is required"),

  body("dateOfBirth").isISO8601().withMessage("Valid date of birth required"),

  body("gender")
    .isIn(["Male", "Female", "Other"])
    .withMessage("Valid gender required"),

  body("bloodType")
    .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .withMessage("Valid blood type required"),

  body("contactNumber").notEmpty().withMessage("Contact number required"),

  body("assignedDoctor")
    .isMongoId()
    .withMessage("Valid assigned doctor required"),

  body("medicalHistory.renalDiagnosis")
    .notEmpty()
    .withMessage("Renal diagnosis required"),

  body("dialysisInfo.startDate")
    .isISO8601()
    .withMessage("Valid dialysis start date required"),

  body("dialysisInfo.accessType")
    .isIn(["AVF", "AVG", "CENTRAL_CATHETER", "PERITONEAL_CATHETER"])
    .withMessage("Valid access type required"),

  body("dialysisInfo.dryWeight")
    .isNumeric()
    .withMessage("Valid dry weight required"),
];

/**
 * Validation for updating patient
 */
export const validateUpdatePatient = [
  body("name")
    .optional()
    .notEmpty()
    .withMessage("Patient name cannot be empty"),

  body("dateOfBirth")
    .optional()
    .isISO8601()
    .withMessage("Valid date of birth required"),

  body("gender")
    .optional()
    .isIn(["Male", "Female", "Other"])
    .withMessage("Valid gender required"),

  body("bloodType")
    .optional()
    .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .withMessage("Valid blood type required"),

  body("contactNumber")
    .optional()
    .notEmpty()
    .withMessage("Contact number cannot be empty"),

  body("assignedDoctor")
    .optional()
    .isMongoId()
    .withMessage("Valid doctor required"),

  body("assignedNurse")
    .optional()
    .isMongoId()
    .withMessage("Valid nurse required"),

  body("medicalHistory.renalDiagnosis")
    .optional()
    .notEmpty()
    .withMessage("Renal diagnosis cannot be empty"),

  body("dialysisInfo.startDate")
    .optional()
    .isISO8601()
    .withMessage("Valid dialysis start date required"),

  body("dialysisInfo.accessType")
    .optional()
    .isIn(["AVF", "AVG", "CENTRAL_CATHETER", "PERITONEAL_CATHETER"])
    .withMessage("Valid access type required"),

  body("dialysisInfo.dryWeight")
    .optional()
    .isNumeric()
    .withMessage("Valid dry weight required"),

  body("dialysisInfo.dialysisType")
    .optional()
    .isIn(["HEMODIALYSIS", "PERITONEAL_DIALYSIS"])
    .withMessage("Valid dialysis type required"),
];

/**
 * Validation for adding patient note
 */
export const validatePatientNote = [
  body("content").notEmpty().withMessage("Note content required"),

  body("type")
    .optional()
    .isIn(["GENERAL", "MEDICAL", "ADMINISTRATIVE"])
    .withMessage("Invalid note type"),
];

/**
 * Validate patient search query
 */
export const validateSearchQuery = (
  req: Request,
  res: Response,
  next: NextFunction,
): Response | void => {
  const query = req.query.q as string;

  if (!query || query.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Search query required",
    });
  }

  if (query.length < 2) {
    return res.status(400).json({
      success: false,
      message: "Search query must be at least 2 characters",
    });
  }

  next();
};

/**
 * Validate patient ID param
 */
export const validatePatientId = (
  req: Request,
  res: Response,
  next: NextFunction,
): Response | void => {
  const id = req.params.id as string;

  if (!id || id.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Patient ID required",
    });
  }

  next();
};
