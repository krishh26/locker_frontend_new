export type NotificationType = "notification" | "news" | "allocation";

export interface Notification {
  notification_id: number;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  created_at: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface NotificationFilters {
  page?: number;
  page_size?: number;
  type?: NotificationType | "all";
  read?: boolean | "all";
}

export interface NotificationListResponse {
  status: boolean;
  message?: string;
  data: Notification[];
  meta_data?: {
    page: number;
    page_size: number;
    pages: number;
    items: number;
  };
  error?: string;
}

export interface NotificationResponse {
  status: boolean;
  message?: string;
  data?: Notification;
  error?: string;
}

export interface ReadNotificationRequest {
  notification_id?: number; // If not provided, marks all as read
}

export interface ReadNotificationResponse {
  status: boolean;
  message?: string;
  error?: string;
}

export interface DeleteNotificationRequest {
  notification_id?: number; // If not provided, deletes all
}

export interface DeleteNotificationResponse {
  status: boolean;
  message?: string;
  error?: string;
}

