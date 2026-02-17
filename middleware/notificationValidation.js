const { body, param, query } = require("express-validator");

// Validation for creating a notification
const createNotification = [
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 200 })
    .withMessage("Title cannot exceed 200 characters")
    .trim(),

  body("message")
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ max: 500 })
    .withMessage("Message cannot exceed 500 characters")
    .trim(),

  body("type")
    .isIn(["INFO", "WARNING", "CRITICAL", "SUCCESS"])
    .withMessage("Type must be one of: INFO, WARNING, CRITICAL, SUCCESS"),

  body("priority")
    .optional()
    .isIn(["LOW", "MEDIUM", "HIGH", "URGENT"])
    .withMessage("Priority must be one of: LOW, MEDIUM, HIGH, URGENT"),

  body("category")
    .isIn([
      "PATIENT_ALERT",
      "LAB_RESULT",
      "APPOINTMENT_REMINDER",
      "DIALYSIS_ALERT",
      "AI_PREDICTION",
      "SYSTEM_ALERT",
    ])
    .withMessage(
      "Category must be one of: PATIENT_ALERT, LAB_RESULT, APPOINTMENT_REMINDER, DIALYSIS_ALERT, AI_PREDICTION, SYSTEM_ALERT",
    ),

  body("recipient")
    .isMongoId()
    .withMessage("Recipient must be a valid user ID"),

  body("relatedEntity.entityType")
    .optional()
    .isIn(["Patient", "DialysisSession", "MonthlyInvestigation", "User"])
    .withMessage(
      "Entity type must be one of: Patient, DialysisSession, MonthlyInvestigation, User",
    ),

  body("relatedEntity.entityId")
    .optional()
    .isMongoId()
    .withMessage("Entity ID must be a valid MongoDB ID"),

  body("data.actionRequired")
    .optional()
    .isBoolean()
    .withMessage("Action required must be a boolean"),

  body("data.actionUrl")
    .optional()
    .isURL()
    .withMessage("Action URL must be a valid URL"),

  body("data.labValue.parameter")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Lab parameter must be between 1-100 characters"),

  body("data.labValue.flag")
    .optional()
    .isIn(["NORMAL", "HIGH", "LOW", "CRITICAL"])
    .withMessage("Lab flag must be one of: NORMAL, HIGH, LOW, CRITICAL"),

  body("data.appointmentDate")
    .optional()
    .isISO8601()
    .withMessage("Appointment date must be a valid date"),

  body("expiresAt")
    .optional()
    .isISO8601()
    .withMessage("Expiration date must be a valid date"),
];

// Validation for updating notification read status
const markAsRead = [
  param("id").isMongoId().withMessage("Invalid notification ID"),
];

// Validation for getting notifications with query params
const getNotifications = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("type")
    .optional()
    .isIn(["INFO", "WARNING", "CRITICAL", "SUCCESS"])
    .withMessage("Type must be one of: INFO, WARNING, CRITICAL, SUCCESS"),

  query("category")
    .optional()
    .isIn([
      "PATIENT_ALERT",
      "LAB_RESULT",
      "APPOINTMENT_REMINDER",
      "DIALYSIS_ALERT",
      "AI_PREDICTION",
      "SYSTEM_ALERT",
    ])
    .withMessage("Invalid category"),

  query("priority")
    .optional()
    .isIn(["LOW", "MEDIUM", "HIGH", "URGENT"])
    .withMessage("Priority must be one of: LOW, MEDIUM, HIGH, URGENT"),

  query("isRead")
    .optional()
    .isBoolean()
    .withMessage("isRead must be a boolean"),
];

// Validation for notification ID parameter
const notificationId = [
  param("id").isMongoId().withMessage("Invalid notification ID"),
];

module.exports = {
  createNotification,
  markAsRead,
  getNotifications,
  notificationId,
};
