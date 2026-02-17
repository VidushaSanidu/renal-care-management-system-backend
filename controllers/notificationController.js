const { validationResult } = require("express-validator");
const notificationService = require("../services/notificationService");

class NotificationController {
  // Get notifications for the authenticated user
  async getNotifications(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const userId = req.user.id;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        type: req.query.type,
        category: req.query.category,
        priority: req.query.priority,
        isRead:
          req.query.isRead === "true"
            ? true
            : req.query.isRead === "false"
              ? false
              : undefined,
      };

      const result = await notificationService.getNotificationsForUser(
        userId,
        options,
      );

      res.status(200).json({
        success: true,
        message: "Notifications retrieved successfully",
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get notifications",
        error: error.message,
      });
    }
  }

  // Get single notification by ID
  async getNotificationById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const userId = req.user.id;

      const notification = await notificationService.getNotificationById(
        id,
        userId,
      );

      res.status(200).json({
        success: true,
        message: "Notification retrieved successfully",
        data: notification,
      });
    } catch (error) {
      if (error.message === "Notification not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to get notification",
        error: error.message,
      });
    }
  }

  // Create a new notification
  async createNotification(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const notificationData = {
        ...req.body,
        createdBy: req.user.id,
      };

      const notification =
        await notificationService.createNotification(notificationData);

      res.status(201).json({
        success: true,
        message: "Notification created successfully",
        data: notification,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to create notification",
        error: error.message,
      });
    }
  }

  // Mark notification as read
  async markAsRead(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const userId = req.user.id;

      const notification = await notificationService.markAsRead(id, userId);

      res.status(200).json({
        success: true,
        message: "Notification marked as read",
        data: notification,
      });
    } catch (error) {
      if (error.message === "Notification not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to mark notification as read",
        error: error.message,
      });
    }
  }

  // Mark all notifications as read
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      const result = await notificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: "All notifications marked as read",
        data: { modifiedCount: result.modifiedCount },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to mark all notifications as read",
        error: error.message,
      });
    }
  }

  // Get unread count
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const result = await notificationService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        message: "Unread count retrieved successfully",
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get unread count",
        error: error.message,
      });
    }
  }

  // Delete notification
  async deleteNotification(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const userId = req.user.id;

      const notification = await notificationService.deleteNotification(
        id,
        userId,
      );

      res.status(200).json({
        success: true,
        message: "Notification deleted successfully",
        data: notification,
      });
    } catch (error) {
      if (error.message === "Notification not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to delete notification",
        error: error.message,
      });
    }
  }

  // Delete all notifications
  async deleteAllNotifications(req, res) {
    try {
      const userId = req.user.id;
      const result = await notificationService.deleteAllNotifications(userId);

      res.status(200).json({
        success: true,
        message: "All notifications deleted successfully",
        data: { deletedCount: result.deletedCount },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to delete notifications",
        error: error.message,
      });
    }
  }

  // Create broadcast notification (admin only)
  async createBroadcastNotification(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      // Check if user is admin
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admin role required.",
        });
      }

      const { userIds, ...notificationData } = req.body;
      notificationData.createdBy = req.user.id;

      const notifications =
        await notificationService.createBroadcastNotification(
          notificationData,
          userIds,
        );

      res.status(201).json({
        success: true,
        message: "Broadcast notifications created successfully",
        data: {
          count: notifications.length,
          notifications,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to create broadcast notifications",
        error: error.message,
      });
    }
  }
}

module.exports = new NotificationController();
