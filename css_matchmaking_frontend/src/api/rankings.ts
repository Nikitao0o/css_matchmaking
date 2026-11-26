import { request } from './client';
import type { LeaderboardEntry } from './types';

/**
 * Получить таблицу лидеров по ELO
 */
export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    return await request<LeaderboardEntry[]>('/rankings');
  } catch (err: unknown) {
    console.warn('[API] GET /rankings — эндпоинт не реализован на бэкенде:', err);
    return [];
  }
}
