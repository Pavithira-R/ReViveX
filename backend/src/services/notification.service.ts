// Member 6 – In-app notifications
import { Notification } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../utils';
import { NotificationList, NotificationView, NotifyOptions } from '../types';

const LIST_LIMIT = 50;

const toView = (n: Notification): NotificationView => ({
  id: n.id,
  type: n.type,
  title: n.title,
  message: n.message,
  refId: n.refId,
  isRead: n.readAt !== null,
  createdAt: n.createdAt,
});

export class NotificationService {
  /**
   * Send an in-app notification. Called by other modules when something happens, e.g.
   *   await notify(request.ownerId, 'Repair completed', 'Your laptop is ready.', { type: 'REPAIR', refId: request.id });
   * Never throws: a failed notification must not break the action that triggered it.
   */
  async notify(
    userId: string,
    title: string,
    message: string,
    options: NotifyOptions = {}
  ): Promise<NotificationView | null> {
    try {
      const created = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type: options.type ?? 'GENERAL',
          refId: options.refId ?? null,
        },
      });
      return toView(created);
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('[Notifications] Could not create notification', error);
      }
      return null;
    }
  }

  /** The signed-in user's latest notifications, newest first, with the unread count. */
  async listForUser(userId: string): Promise<NotificationList> {
    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: LIST_LIMIT,
      }),
      prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return { items: items.map(toView), unreadCount };
  }

  async markRead(userId: string, notificationId: string): Promise<NotificationView> {
    const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
    // Someone else's notification is reported as not found, so ids can't be probed.
    if (!notification || notification.userId !== userId) {
      throw new AppError('Notification not found', 404, 'NOT_FOUND');
    }
    if (notification.readAt) return toView(notification);

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
    return toView(updated);
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }
}

export const notificationService = new NotificationService();

/** Shortcut for other modules: `import { notify } from '../services';` */
export const notify = (userId: string, title: string, message: string, options?: NotifyOptions) =>
  notificationService.notify(userId, title, message, options);
