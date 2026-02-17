const { body } = require("express-validator");

const dialysisSessionValidation = {
  // Create session validation
  createSession: [
    body("date").isISO8601().withMessage("Valid date is required"),
    body("startTime")
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Valid start time is required (HH:MM)"),
    body("preDialysis.weight")
      .isNumeric()
      .withMessage("Valid pre-dialysis weight is required"),
    body("preDialysis.bloodPressure.systolic")
      .isInt({ min: 50, max: 300 })
      .withMessage("Valid systolic BP is required"),
    body("preDialysis.bloodPressure.diastolic")
      .isInt({ min: 30, max: 200 })
      .withMessage("Valid diastolic BP is required"),
    body("preDialysis.heartRate")
      .isInt({ min: 30, max: 200 })
      .withMessage("Valid heart rate is required"),
    body("preDialysis.temperature")
      .isFloat({ min: 30, max: 45 })
      .withMessage("Valid temperature is required"),
    body("dialysisParameters.ufGoal")
      .isFloat({ min: 0, max: 5 })
      .withMessage("Valid UF goal is required"),
    body("vascularAccess.type")
      .isIn(["AVF", "AVG", "CENTRAL_CATHETER", "PERITONEAL_CATHETER"])
      .withMessage("Valid access type is required"),
    body("vascularAccess.site")
      .notEmpty()
      .withMessage("Access site is required"),
  ],

  // Update session validation
  updateSession: [
    body("date").optional().isISO8601().withMessage("Valid date is required"),
    body("startTime")
      .optional()
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Valid start time is required"),
    body("endTime")
      .optional()
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Valid end time is required"),
  ],

  // Complete session validation
  completeSession: [
    body("postDialysis.weight")
      .isNumeric()
      .withMessage("Post-dialysis weight is required"),
    body("postDialysis.bloodPressure.systolic")
      .isInt({ min: 50, max: 300 })
      .withMessage("Valid systolic BP is required"),
    body("postDialysis.bloodPressure.diastolic")
      .isInt({ min: 30, max: 200 })
      .withMessage("Valid diastolic BP is required"),
    body("endTime")
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Valid end time is required"),
  ],
};

module.exports = dialysisSessionValidation;
