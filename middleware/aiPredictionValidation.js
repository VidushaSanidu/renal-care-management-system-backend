const { body } = require("express-validator");

/**
 * Validation middleware for Hemoglobin prediction
 */
const validateHbPrediction = [
  body("age")
    .isNumeric()
    .withMessage("Age must be a number")
    .isFloat({ min: 0, max: 120 })
    .withMessage("Age must be between 0 and 120"),

  body("gender").custom((value) => {
    const validGenders = ["Male", "Female", "M", "F", 0, 1, "0", "1"];
    if (!validGenders.includes(value)) {
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
 * Validation middleware for patient ID parameter
 */
const validatePatientIdParam = (req, res, next) => {
  const { patientId } = req.params;

  if (!patientId || patientId.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Patient ID is required",
    });
  }

  // Basic patient ID format validation (assuming it's alphanumeric)
  if (!/^[A-Za-z0-9_-]+$/.test(patientId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid patient ID format",
    });
  }

  next();
};

/**
 * Custom validation to ensure logical weight relationships
 */
const validateWeightLogic = (req, res, next) => {
  const { dry_weight, pre_dialysis_weight, post_dialysis_weight } = req.body;

  if (pre_dialysis_weight && post_dialysis_weight && dry_weight) {
    // Post-dialysis weight should typically be less than or equal to pre-dialysis weight
    if (post_dialysis_weight > pre_dialysis_weight) {
      return res.status(400).json({
        success: false,
        message:
          "Post-dialysis weight should typically be less than or equal to pre-dialysis weight",
      });
    }

    // Check if weights are within reasonable range of dry weight
    const dryWeightNum = parseFloat(dry_weight);
    const preWeightNum = parseFloat(pre_dialysis_weight);
    const postWeightNum = parseFloat(post_dialysis_weight);

    if (
      preWeightNum < dryWeightNum * 0.8 ||
      preWeightNum > dryWeightNum * 1.5
    ) {
      return res.status(400).json({
        success: false,
        message: "Pre-dialysis weight seems unrealistic compared to dry weight",
      });
    }

    if (
      postWeightNum < dryWeightNum * 0.8 ||
      postWeightNum > dryWeightNum * 1.3
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Post-dialysis weight seems unrealistic compared to dry weight",
      });
    }
  }

  next();
};

module.exports = {
  validateHbPrediction,
  validateWeightLogic,
  validatePatientIdParam,
};
