import { request } from './client';
import type { GameServerInfo } from './types';

/**
 * Получить список активных игровых серверов
 */
export async function fetchServers(): Promise<GameServerInfo[]> {
  try {
    return await request<GameServerInfo[]>('/servers');
  } catch (err: unknown) {
    console.warn('[API] GET /servers — не удалось получить список серверов:', err);
    return [];
  }
}
