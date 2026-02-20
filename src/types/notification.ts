/**
 * Query options type
 */
export interface NotificationQueryOptions {
  page?: number;
  limit?: number;
  type?: string;
  category?: string;
  priority?: string;
  isRead?: boolean;
}
