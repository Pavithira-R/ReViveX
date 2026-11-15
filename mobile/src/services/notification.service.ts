// Member 6 – In-app notifications
import { addDoc, collection } from 'firebase/firestore';
import { apiRequest } from './api';
import { db } from './firebase';
import { nowIso } from './firebaseHelpers';
import { AppNotification, NotificationList } from '../types';

export interface NotifyOptions {
  /** ECO / REPAIR / LISTING / RECYCLING / REVIEW / MESSAGE / GENERAL */
  type?: string;
  refId?: string | null;
}

/**
 * Send an in-app notification to a user. Used by other modules when something happens, e.g.
 *   await notify(request.customerId, 'Repair completed', 'Your laptop is ready.', { type: 'REPAIR', refId: request.id });
 * Never throws: a failed notification must not break the action that triggered it.
 */
export const notify = async (
  userId: string,
  title: string,
  message: string,
  options: NotifyOptions = {}
): Promise<boolean> => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      type: options.type ?? 'GENERAL',
      refId: options.refId ?? null,
      isRead: false,
      createdAt: nowIso(),
    });
    return true;
  } catch {
    return false;
  }
};

// The list below moves to Firestore in Phase 2.
export const notificationService = {
  list: () => apiRequest<NotificationList>('GET', '/notifications'),

  markRead: (id: string) => apiRequest<AppNotification>('PATCH', `/notifications/${id}/read`),

  markAllRead: () => apiRequest<{ updated: number }>('PATCH', '/notifications/read-all'),
};
