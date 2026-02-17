const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const notificationValidation = require("../middleware/notificationValidation");
const auth = require("../middleware/auth");

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
 *           description: The auto-generated id of the notification
 *         title:
 *           type: string
 *           description: The title of the notification
 *           maxLength: 200
 *         message:
 *           type: string
 *           description: The notification message
 *           maxLength: 500
 *         type:
 *           type: string
 *           enum: [INFO, WARNING, CRITICAL, SUCCESS]
 *           description: The type of notification
 *         priority:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *           description: The priority level
 *         category:
 *           type: string
 *           enum: [PATIENT_ALERT, LAB_RESULT, APPOINTMENT_REMINDER, DIALYSIS_ALERT, AI_PREDICTION, SYSTEM_ALERT]
 *           description: The category of notification
 *         recipient:
 *           type: string
 *           description: User ID of the recipient
 *         isRead:
 *           type: boolean
 *           description: Read status
 *         readAt:
 *           type: string
 *           format: date-time
 *           description: When the notification was read
 *         relatedEntity:
 *           type: object
 *           properties:
 *             entityType:
 *               type: string
 *               enum: [Patient, DialysisSession, MonthlyInvestigation, User]
 *             entityId:
 *               type: string
 *         data:
 *           type: object
 *           properties:
 *             actionRequired:
 *               type: boolean
 *             actionUrl:
 *               type: string
 *             labValue:
 *               type: object
 *               properties:
 *                 parameter:
 *                   type: string
 *                 value:
 *                   type: string
 *                 normalRange:
 *                   type: string
 *                 flag:
 *                   type: string
 *                   enum: [NORMAL, HIGH, LOW, CRITICAL]
 *             appointmentDate:
 *               type: string
 *               format: date-time
 *             appointmentType:
 *               type: string
 *         createdBy:
 *           type: string
 *           description: User ID who created the notification
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: When the notification expires
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of notifications per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INFO, WARNING, CRITICAL, SUCCESS]
 *         description: Filter by notification type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [PATIENT_ALERT, LAB_RESULT, APPOINTMENT_REMINDER, DIALYSIS_ALERT, AI_PREDICTION, SYSTEM_ALERT]
 *         description: Filter by category
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *         description: Filter by priority
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/",
  auth.protect,
  notificationValidation.getNotifications,
  notificationController.getNotifications,
);

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/unread-count",
  auth.protect,
  notificationController.getUnreadCount,
);

/**
 * @swagger
 * /api/notifications/mark-all-read:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.patch(
  "/mark-all-read",
  auth.protect,
  notificationController.markAllAsRead,
);

/**
 * @swagger
 * /api/notifications/clear-all:
 *   delete:
 *     summary: Delete all notifications for the user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications deleted successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete(
  "/clear-all",
  auth.protect,
  notificationController.deleteAllNotifications,
);

/**
 * @swagger
 * /api/notifications/broadcast:
 *   post:
 *     summary: Create broadcast notification (Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *               - type
 *               - category
 *               - userIds
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               message:
 *                 type: string
 *                 maxLength: 500
 *               type:
 *                 type: string
 *                 enum: [INFO, WARNING, CRITICAL, SUCCESS]
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *               category:
 *                 type: string
 *                 enum: [PATIENT_ALERT, LAB_RESULT, APPOINTMENT_REMINDER, DIALYSIS_ALERT, AI_PREDICTION, SYSTEM_ALERT]
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Broadcast notifications created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied (Admin only)
 *       500:
 *         description: Server error
 */
router.post(
  "/broadcast",
  auth.protect,
  notificationValidation.createNotification,
  notificationController.createBroadcastNotification,
);

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     summary: Get notification by ID
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification retrieved successfully
 *       400:
 *         description: Invalid notification ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.get(
  "/:id",
  auth.protect,
  notificationValidation.notificationId,
  notificationController.getNotificationById,
);

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Create a new notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *               - type
 *               - category
 *               - recipient
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               message:
 *                 type: string
 *                 maxLength: 500
 *               type:
 *                 type: string
 *                 enum: [INFO, WARNING, CRITICAL, SUCCESS]
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *               category:
 *                 type: string
 *                 enum: [PATIENT_ALERT, LAB_RESULT, APPOINTMENT_REMINDER, DIALYSIS_ALERT, AI_PREDICTION, SYSTEM_ALERT]
 *               recipient:
 *                 type: string
 *                 description: User ID of the recipient
 *               relatedEntity:
 *                 type: object
 *                 properties:
 *                   entityType:
 *                     type: string
 *                     enum: [Patient, DialysisSession, MonthlyInvestigation, User]
 *                   entityId:
 *                     type: string
 *               data:
 *                 type: object
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Notification created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  auth.protect,
  notificationValidation.createNotification,
  notificationController.createNotification,
);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       400:
 *         description: Invalid notification ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.patch(
  "/:id/read",
  auth.protect,
  notificationValidation.markAsRead,
  notificationController.markAsRead,
);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       400:
 *         description: Invalid notification ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.delete(
  "/:id",
  auth.protect,
  notificationValidation.notificationId,
  notificationController.deleteNotification,
);

module.exports = router;
