const { body } = require("express-validator");

/**
 * Validation middleware for creating a new patient
 */
const validateCreatePatient = [
  body("patientId").notEmpty().withMessage("Patient ID is required"),
  body("name").notEmpty().withMessage("Patient name is required"),
  body("dateOfBirth")
    .isISO8601()
    .withMessage("Valid date of birth is required"),
  body("gender")
    .isIn(["Male", "Female", "Other"])
    .withMessage("Valid gender is required"),
  body("bloodType")
    .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .withMessage("Valid blood type is required"),
  body("contactNumber").notEmpty().withMessage("Contact number is required"),
  body("assignedDoctor")
    .isMongoId()
    .withMessage("Valid assigned doctor is required"),
  body("medicalHistory.renalDiagnosis")
    .notEmpty()
    .withMessage("Renal diagnosis is required"),
  body("dialysisInfo.startDate")
    .isISO8601()
    .withMessage("Valid dialysis start date is required"),
  body("dialysisInfo.accessType")
    .isIn(["AVF", "AVG", "CENTRAL_CATHETER", "PERITONEAL_CATHETER"])
    .withMessage("Valid access type is required"),
  body("dialysisInfo.dryWeight")
    .isNumeric()
    .withMessage("Valid dry weight is required"),
];

/**
 * Validation middleware for updating a patient
 */
const validateUpdatePatient = [
  body("name")
    .optional()
    .notEmpty()
    .withMessage("Patient name cannot be empty"),
  body("dateOfBirth")
    .optional()
    .isISO8601()
    .withMessage("Valid date of birth is required"),
  body("gender")
    .optional()
    .isIn(["Male", "Female", "Other"])
    .withMessage("Valid gender is required"),
  body("bloodType")
    .optional()
    .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .withMessage("Valid blood type is required"),
  body("contactNumber")
    .optional()
    .notEmpty()
    .withMessage("Contact number cannot be empty"),
  body("assignedDoctor")
    .optional()
    .isMongoId()
    .withMessage("Valid assigned doctor is required"),
  body("assignedNurse")
    .optional()
    .isMongoId()
    .withMessage("Valid assigned nurse is required"),
  body("medicalHistory.renalDiagnosis")
    .optional()
    .notEmpty()
    .withMessage("Renal diagnosis cannot be empty"),
  body("dialysisInfo.startDate")
    .optional()
    .isISO8601()
    .withMessage("Valid dialysis start date is required"),
  body("dialysisInfo.accessType")
    .optional()
    .isIn(["AVF", "AVG", "CENTRAL_CATHETER", "PERITONEAL_CATHETER"])
    .withMessage("Valid access type is required"),
  body("dialysisInfo.dryWeight")
    .optional()
    .isNumeric()
    .withMessage("Valid dry weight is required"),
  body("dialysisInfo.dialysisType")
    .optional()
    .isIn(["HEMODIALYSIS", "PERITONEAL_DIALYSIS"])
    .withMessage("Valid dialysis type is required"),
];

/**
 * Validation middleware for adding a note to patient
 */
const validatePatientNote = [
  body("content").notEmpty().withMessage("Note content is required"),
  body("type")
    .optional()
    .isIn(["GENERAL", "MEDICAL", "ADMINISTRATIVE"])
    .withMessage("Invalid note type"),
];

/**
 * Validation middleware for patient search query
 */
const validateSearchQuery = (req, res, next) => {
  const { q } = req.query;

  if (!q || q.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Search query is required",
    });
  }

  if (q.length < 2) {
    return res.status(400).json({
      success: false,
      message: "Search query must be at least 2 characters long",
    });
  }

  next();
};

/**
 * Validation middleware for patient ID parameter
 */
const validatePatientId = (req, res, next) => {
  const { id } = req.params;

  if (!id || id.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Patient ID is required",
    });
  }

  next();
};

module.exports = {
  validateCreatePatient,
  validateUpdatePatient,
  validatePatientNote,
  validateSearchQuery,
  validatePatientId,
};
