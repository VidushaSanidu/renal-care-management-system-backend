import type { Request, Response } from "express";
import { validationResult } from "express-validator";

import notificationService from "../services/notificationService.js";
import type { NotificationQueryOptions } from "../types/notification.js";

class NotificationController {
  /**
   * Get notifications for authenticated user
   */
  async getNotifications(req: Request, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const userId = req.user!.id;

      const options: NotificationQueryOptions = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        type: req.query.type as string,
        category: req.query.category as string,
        priority: req.query.priority as string,
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

      return res.json({
        success: true,
        message: "Notifications retrieved successfully",
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";

      return res.status(500).json({
        success: false,
        message: "Failed to get notifications",
        error: message,
      });
    }
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(req: Request, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { id } = req.params as { id: string };
      const userId = req.user!.id;

      const notification = await notificationService.getNotificationById(
        id,
        userId,
      );

      return res.json({
        success: true,
        message: "Notification retrieved successfully",
        data: notification,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";

      if (message === "Notification not found") {
        return res.status(404).json({
          success: false,
          message,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to get notification",
        error: message,
      });
    }
  }

  /**
   * Create notification
   */
  async createNotification(req: Request, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const notificationData = {
        ...req.body,
        createdBy: req.user!.id,
      };

      const notification =
        await notificationService.createNotification(notificationData);

      return res.status(201).json({
        success: true,
        message: "Notification created successfully",
        data: notification,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";

      return res.status(500).json({
        success: false,
        message: "Failed to create notification",
        error: message,
      });
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params as { id: string };
      const userId = req.user!.id;

      const notification = await notificationService.markAsRead(id, userId);

      return res.json({
        success: true,
        message: "Notification marked as read",
        data: notification,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";

      if (message === "Notification not found") {
        return res.status(404).json({
          success: false,
          message,
        });
      }

      return res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(req: Request, res: Response): Promise<Response> {
    try {
      const result = await notificationService.markAllAsRead(req.user!.id);

      return res.json({
        success: true,
        message: "All notifications marked as read",
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";

      return res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(req: Request, res: Response): Promise<Response> {
    try {
      const result = await notificationService.getUnreadCount(req.user!.id);

      return res.json({
        success: true,
        message: "Unread count retrieved successfully",
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";

      return res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params as { id: string };

      const notification = await notificationService.deleteNotification(
        id,
        req.user!.id,
      );

      return res.json({
        success: true,
        message: "Notification deleted successfully",
        data: notification,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";

      if (message === "Notification not found") {
        return res.status(404).json({
          success: false,
          message,
        });
      }

      return res.status(500).json({
        success: false,
        message,
      });
    }
  }

  async deleteAllNotifications(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user.id;
      const result = await notificationService.deleteAllNotifications(userId);

      return res.status(200).json({
        success: true,
        message: "All notifications deleted successfully",
        data: { deletedCount: result.deletedCount },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";

      if (message === "Notification not found") {
        return res.status(404).json({
          success: false,
          message,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to delete notifications",
        error: message,
      });
    }
  }

  /**
   * Broadcast notification (admin only)
   */
  async createBroadcastNotification(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      if (req.user!.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Admin access required",
        });
      }

      const { userIds, ...notificationData } = req.body;

      notificationData.createdBy = req.user!.id;

      const notifications =
        await notificationService.createBroadcastNotification(
          notificationData,
          userIds,
        );

      return res.status(201).json({
        success: true,
        message: "Broadcast notifications created",
        data: notifications,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";

      return res.status(500).json({
        success: false,
        message,
        error: message,
      });
    }
  }
}

export default new NotificationController();
