import { body, param, query } from "express-validator";

/**
 * Validation for creating notification
 */
export const createNotification = [
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
    .withMessage("Type must be INFO, WARNING, CRITICAL, or SUCCESS"),

  body("priority")
    .optional()
    .isIn(["LOW", "MEDIUM", "HIGH", "URGENT"])
    .withMessage("Priority must be LOW, MEDIUM, HIGH, or URGENT"),

  body("category")
    .isIn([
      "PATIENT_ALERT",
      "LAB_RESULT",
      "APPOINTMENT_REMINDER",
      "DIALYSIS_ALERT",
      "AI_PREDICTION",
      "SYSTEM_ALERT",
    ])
    .withMessage("Invalid category"),

  body("recipient")
    .isMongoId()
    .withMessage("Recipient must be valid MongoDB ID"),

  body("relatedEntity.entityType")
    .optional()
    .isIn(["Patient", "DialysisSession", "MonthlyInvestigation", "User"])
    .withMessage("Invalid entity type"),

  body("relatedEntity.entityId")
    .optional()
    .isMongoId()
    .withMessage("Invalid entity ID"),

  body("data.actionRequired")
    .optional()
    .isBoolean()
    .withMessage("actionRequired must be boolean"),

  body("data.actionUrl").optional().isURL().withMessage("Invalid action URL"),

  body("data.labValue.parameter")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Lab parameter must be 1-100 characters"),

  body("data.labValue.flag")
    .optional()
    .isIn(["NORMAL", "HIGH", "LOW", "CRITICAL"])
    .withMessage("Invalid lab flag"),

  body("data.appointmentDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid appointment date"),

  body("expiresAt")
    .optional()
    .isISO8601()
    .withMessage("Invalid expiration date"),
];

/**
 * Validation for marking notification as read
 */
export const markAsRead = [
  param("id").isMongoId().withMessage("Invalid notification ID"),
];

/**
 * Validation for notification query params
 */
export const getNotifications = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be 1-100"),

  query("type")
    .optional()
    .isIn(["INFO", "WARNING", "CRITICAL", "SUCCESS"])
    .withMessage("Invalid type"),

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
    .withMessage("Invalid priority"),

  query("isRead").optional().isBoolean().withMessage("isRead must be boolean"),
];

/**
 * Validation for notification ID param
 */
export const notificationId = [
  param("id").isMongoId().withMessage("Invalid notification ID"),
];
