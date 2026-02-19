import Notification from "../models/Notification.js";
import User from "../models/User.js";

import { Types, QueryFilter } from "mongoose";

import type { INotification } from "../models/Notification.js";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export interface NotificationOptions {
  page?: number;
  limit?: number;
  type?: string;
  category?: string;
  priority?: string;
  isRead?: boolean;
}

export interface BroadcastNotificationInput {
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "CRITICAL" | "SUCCESS";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  category: string;
  createdBy?: Types.ObjectId | string;
  relatedEntity?: {
    entityType: "Patient" | "DialysisSession" | "MonthlyInvestigation" | "User";
    entityId: Types.ObjectId | string;
  };
  data?: Record<string, unknown>;
}

/*
|--------------------------------------------------------------------------
| Service
|--------------------------------------------------------------------------
*/

class NotificationService {
  /*
  |--------------------------------------------------------------------------
  | Create single notification
  |--------------------------------------------------------------------------
  */

  async createNotification(notificationData: Partial<INotification>) {
    const notification = await Notification.create(notificationData);

    return notification;
  }

  /*
  |--------------------------------------------------------------------------
  | Get user notifications
  |--------------------------------------------------------------------------
  */

  async getNotificationsForUser(
    userId: string | Types.ObjectId,
    options: NotificationOptions = {},
  ) {
    const { page = 1, limit = 20, type, category, priority, isRead } = options;

    const filter: QueryFilter<INotification> = {
      recipient: userId,
    };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (typeof isRead === "boolean") filter.isRead = isRead;

    const skip = (page - 1) * limit;

    const notifications = await Notification.find(filter)
      .populate("recipient", "name email role")
      .populate("createdBy", "name email role")
      .populate("relatedEntity.entityId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Notification.countDocuments(filter);

    return {
      notifications,

      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalNotifications: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Get one notification
  |--------------------------------------------------------------------------
  */

  async getNotificationById(
    notificationId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ) {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId,
    })
      .populate("recipient", "name email role")
      .populate("createdBy", "name email")
      .populate("relatedEntity.entityId")
      .lean();

    if (!notification) {
      throw new Error("Notification not found");
    }

    return notification;
  }

  /*
  |--------------------------------------------------------------------------
  | Mark as read
  |--------------------------------------------------------------------------
  */

  async markAsRead(
    notificationId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ) {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        recipient: userId,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
      { new: true },
    );

    if (!notification) {
      throw new Error("Notification not found");
    }

    return notification;
  }

  /*
  |--------------------------------------------------------------------------
  | Mark all read
  |--------------------------------------------------------------------------
  */

  async markAllAsRead(userId: string | Types.ObjectId) {
    return Notification.updateMany(
      {
        recipient: userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Unread count
  |--------------------------------------------------------------------------
  */

  async getUnreadCount(userId: string | Types.ObjectId) {
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return { unreadCount };
  }

  /*
  |--------------------------------------------------------------------------
  | Delete one
  |--------------------------------------------------------------------------
  */

  async deleteNotification(
    notificationId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ) {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId,
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    return notification;
  }

  /*
  |--------------------------------------------------------------------------
  | Delete all user notifications
  |--------------------------------------------------------------------------
  */

  async deleteAllNotifications(userId: string | Types.ObjectId) {
    return Notification.deleteMany({
      recipient: userId,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Broadcast notification
  |--------------------------------------------------------------------------
  */

  async createBroadcastNotification(
    notificationData: BroadcastNotificationInput,
    userIds: (string | Types.ObjectId)[],
  ) {
    const notifications = userIds.map((userId) => ({
      ...notificationData,
      recipient: userId,
    }));

    return Notification.insertMany(notifications);
  }

  /*
  |--------------------------------------------------------------------------
  | Patient alert helper
  |--------------------------------------------------------------------------
  */

  async createPatientAlert(
    patientId: string | Types.ObjectId,

    title: string,

    message: string,

    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" = "MEDIUM",

    createdBy?: string | Types.ObjectId,

    additionalData = {},
  ) {
    const users = await User.find({
      role: {
        $in: ["doctor", "nurse"],
      },
      isActive: true,
    }).select("_id");

    const userIds = users.map((u) => u._id);

    return this.createBroadcastNotification(
      {
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
      },
      userIds,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Lab result helper
  |--------------------------------------------------------------------------
  */

  async createLabResultNotification(
    patientId: string | Types.ObjectId,

    labData: {
      parameter: string;
      value: string;
      flag: "NORMAL" | "HIGH" | "LOW" | "CRITICAL";
    },

    recipientId: string | Types.ObjectId,

    createdBy?: string | Types.ObjectId,
  ) {
    return this.createNotification({
      title: `Lab Result: ${labData.parameter}`,

      message: `Value: ${labData.value} (${labData.flag})`,

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
    });
  }
}

export default new NotificationService();
