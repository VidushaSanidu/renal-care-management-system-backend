const Notification = require("../models/Notification");

class NotificationService {
  // Create a new notification
  async createNotification(notificationData) {
    try {
      const notification = new Notification(notificationData);
      return await notification.save();
    } catch (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }
  }

  // Get notifications for a specific user
  async getNotificationsForUser(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        category,
        priority,
        isRead,
      } = options;

      // Build filter
      const filter = { recipient: userId };

      if (type) filter.type = type;
      if (category) filter.category = category;
      if (priority) filter.priority = priority;
      if (typeof isRead === "boolean") filter.isRead = isRead;

      // Calculate skip
      const skip = (page - 1) * limit;

      // Get notifications with pagination
      const notifications = await Notification.find(filter)
        .populate("recipient", "username email role")
        .populate("createdBy", "username email")
        .populate("relatedEntity.entityId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count
      const total = await Notification.countDocuments(filter);

      return {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalNotifications: total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new Error(`Failed to get notifications: ${error.message}`);
    }
  }

  // Get single notification by ID
  async getNotificationById(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        recipient: userId,
      })
        .populate("recipient", "username email role")
        .populate("createdBy", "username email")
        .populate("relatedEntity.entityId");

      if (!notification) {
        throw new Error("Notification not found");
      }

      return notification;
    } catch (error) {
      throw new Error(`Failed to get notification: ${error.message}`);
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        {
          isRead: true,
          readAt: new Date(),
        },
        { new: true },
      ).populate("recipient", "username email role");

      if (!notification) {
        throw new Error("Notification not found");
      }

      return notification;
    } catch (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { recipient: userId, isRead: false },
        {
          isRead: true,
          readAt: new Date(),
        },
      );

      return result;
    } catch (error) {
      throw new Error(
        `Failed to mark all notifications as read: ${error.message}`,
      );
    }
  }

  // Get unread count for a user
  async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({
        recipient: userId,
        isRead: false,
      });

      return { unreadCount: count };
    } catch (error) {
      throw new Error(`Failed to get unread count: ${error.message}`);
    }
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        recipient: userId,
      });

      if (!notification) {
        throw new Error("Notification not found");
      }

      return notification;
    } catch (error) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  }

  // Delete all notifications for a user
  async deleteAllNotifications(userId) {
    try {
      const result = await Notification.deleteMany({
        recipient: userId,
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to delete notifications: ${error.message}`);
    }
  }

  // Create notification for multiple users (broadcast)
  async createBroadcastNotification(notificationData, userIds) {
    try {
      const notifications = userIds.map((userId) => ({
        ...notificationData,
        recipient: userId,
      }));

      const result = await Notification.insertMany(notifications);
      return result;
    } catch (error) {
      throw new Error(
        `Failed to create broadcast notifications: ${error.message}`,
      );
    }
  }

  // Helper method to create patient alert notification
  async createPatientAlert(
    patientId,
    title,
    message,
    priority = "MEDIUM",
    createdBy,
    additionalData = {},
  ) {
    const notificationData = {
      title,
      message,
      type: "WARNING",
      priority,
      category: "PATIENT_ALERT",
      createdBy,
      relatedEntity: {
        entityType: "Patient",
        entityId: patientId,
      },
      data: additionalData,
    };

    // Get all doctors and nurses to notify
    const User = require("../models/User");
    const users = await User.find({
      role: { $in: ["doctor", "nurse"] },
      isActive: true,
    }).select("_id");

    const userIds = users.map((user) => user._id);
    return await this.createBroadcastNotification(notificationData, userIds);
  }

  // Helper method to create lab result notification
  async createLabResultNotification(
    patientId,
    labData,
    recipientId,
    createdBy,
  ) {
    const notificationData = {
      title: `Lab Result: ${labData.parameter}`,
      message: `New lab result for patient. Value: ${labData.value} (${labData.flag})`,
      type: labData.flag === "CRITICAL" ? "CRITICAL" : "INFO",
      priority: labData.flag === "CRITICAL" ? "URGENT" : "MEDIUM",
      category: "LAB_RESULT",
      recipient: recipientId,
      createdBy,
      relatedEntity: {
        entityType: "Patient",
        entityId: patientId,
      },
      data: {
        labValue: labData,
      },
    };

    return await this.createNotification(notificationData);
  }
}

module.exports = new NotificationService();
