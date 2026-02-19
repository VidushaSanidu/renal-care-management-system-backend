import express, { Router } from "express";

import notificationController from "../controllers/notificationController.js";
import * as notificationValidation from "../middleware/notificationValidation.js";

import * as auth from "../middleware/auth.js";

const router: Router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - title
 *         - message
 *         - type
 *         - category
 *         - recipient
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *           maxLength: 200
 *         message:
 *           type: string
 *           maxLength: 500
 *         type:
 *           type: string
 *           enum: [INFO, WARNING, CRITICAL, SUCCESS]
 *         priority:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *         category:
 *           type: string
 *           enum: [PATIENT_ALERT, LAB_RESULT, APPOINTMENT_REMINDER, DIALYSIS_ALERT, AI_PREDICTION, SYSTEM_ALERT]
 *         recipient:
 *           type: string
 *         isRead:
 *           type: boolean
 *         readAt:
 *           type: string
 *           format: date-time
 *         relatedEntity:
 *           type: object
 *         data:
 *           type: object
 *         createdBy:
 *           type: string
 *         expiresAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * Get notifications for authenticated user
 */
router.get(
  "/",
  auth.protect,
  notificationValidation.getNotifications,
  notificationController.getNotifications,
);

/**
 * Get unread count
 */
router.get(
  "/unread-count",
  auth.protect,
  notificationController.getUnreadCount,
);

/**
 * Mark all as read
 */
router.patch(
  "/mark-all-read",
  auth.protect,
  notificationController.markAllAsRead,
);

/**
 * Delete all notifications
 */
router.delete(
  "/clear-all",
  auth.protect,
  notificationController.deleteAllNotifications,
);

/**
 * Broadcast notification (Admin)
 */
router.post(
  "/broadcast",
  auth.protect,
  notificationValidation.createNotification,
  notificationController.createBroadcastNotification,
);

/**
 * Get notification by ID
 */
router.get(
  "/:id",
  auth.protect,
  notificationValidation.notificationId,
  notificationController.getNotificationById,
);

/**
 * Create notification
 */
router.post(
  "/",
  auth.protect,
  notificationValidation.createNotification,
  notificationController.createNotification,
);

/**
 * Mark notification as read
 */
router.patch(
  "/:id/read",
  auth.protect,
  notificationValidation.markAsRead,
  notificationController.markAsRead,
);

/**
 * Delete notification
 */
router.delete(
  "/:id",
  auth.protect,
  notificationValidation.notificationId,
  notificationController.deleteNotification,
);

export default router;
