// Member 6 – In-app notifications
import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services';
import { sendSuccess } from '../utils';

export class NotificationController {
  /**
   * GET /api/notifications
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await notificationService.listForUser(req.user!.id);
      sendSuccess(res, 'Notifications retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   */
  async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notification = await notificationService.markRead(req.user!.id, req.params.id);
      sendSuccess(res, 'Notification marked as read', notification);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/read-all
   */
  async markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await notificationService.markAllRead(req.user!.id);
      sendSuccess(res, 'All notifications marked as read', result);
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
