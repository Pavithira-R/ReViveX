// Member 6 – In-app notifications

export type NotificationType = 'ECO' | 'REPAIR' | 'LISTING' | 'RECYCLING' | 'REVIEW' | 'GENERAL';

export interface NotificationView {
  id: string;
  type: string;
  title: string;
  message: string;
  refId: string | null;
  isRead: boolean;
  createdAt: Date | string;
}

/** Response of GET /api/notifications. */
export interface NotificationList {
  items: NotificationView[];
  unreadCount: number;
}

export interface NotifyOptions {
  type?: NotificationType;
  /** Id of the related record, e.g. a repair request. */
  refId?: string;
}
