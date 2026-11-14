// Member 6 – In-app notifications
import { apiRequest } from './api';
import { AppNotification, NotificationList } from '../types';

export const notificationService = {
  list: () => apiRequest<NotificationList>('GET', '/notifications'),

  markRead: (id: string) => apiRequest<AppNotification>('PATCH', `/notifications/${id}/read`),

  markAllRead: () => apiRequest<{ updated: number }>('PATCH', '/notifications/read-all'),
};
