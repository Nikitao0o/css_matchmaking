import { request } from './client';
import type { NotificationItem } from './types';

/**
 * Получить список уведомлений текущего игрока
 */
export async function fetchNotifications(userId: number): Promise<NotificationItem[]> {
  try {
    return await request<NotificationItem[]>(`/notifications?user_id=${userId}`);
  } catch (err: unknown) {
    console.warn('[API] GET /notifications — эндпоинт не реализован на бэкенде:', err);
    return [];
  }
}

/**
 * Отметить уведомление как прочитанное
 */
export async function markNotificationRead(notificationId: number | string): Promise<void> {
  try {
    await request(`/notifications/${notificationId}/read`, { method: 'POST' });
  } catch (err: unknown) {
    console.warn('[API] POST /notifications/read — эндпоинт не реализован на бэкенде:', err);
  }
}
