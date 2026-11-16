// Member 6 – In-app notifications

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  refId: string | null;
  isRead: boolean;
  createdAt: string;
}

/** Response of GET /api/notifications. */
export interface NotificationList {
  items: AppNotification[];
  unreadCount: number;
}
