import { request } from './client';
import type { MatchHistoryItem } from './types';

/**
 * Получить историю завершенных матчей
 */
export async function fetchMatchHistory(): Promise<MatchHistoryItem[]> {
  try {
    return await request<MatchHistoryItem[]>('/matches');
  } catch (err: unknown) {
    console.warn('[API] GET /matches — эндпоинт не реализован на бэкенде:', err);
    return [];
  }
}
