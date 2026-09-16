import { prisma } from "@/lib/db/prisma";

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: "INFO" | "SUCCESS" | "WARNING" | "OPPORTUNITY" | "SYSTEM";
  linkUrl?: string;
}

export class NotificationService {
  /**
   * Creates an in-app notification for the user.
   */
  static async createNotification(input: CreateNotificationInput) {
    return await prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: input.type || "INFO",
        linkUrl: input.linkUrl,
      },
    });
  }

  /**
   * Lists notifications for a user, sorted descending by date.
   */
  static async listUserNotifications(userId: string, limit = 20) {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /**
   * Marks a single notification or all user notifications as read.
   */
  static async markAsRead(userId: string, notificationId?: string) {
    if (notificationId) {
      return await prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { read: true },
      });
    }

    return await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  /**
   * Get unread count.
   */
  static async getUnreadCount(userId: string) {
    return await prisma.notification.count({
      where: { userId, read: false },
    });
  }
}
