import { request } from './client';
import type {
  JoinQueueRequest,
  JoinQueueResponse,
  LeaveQueueResponse,
  QueueStatusResponse,
  ReadyCheckResponse,
} from './types';

/**
 * Добавить игрока в очередь матчмейкинга
 */
export async function joinQueue(data: JoinQueueRequest): Promise<JoinQueueResponse> {
  const query = new URLSearchParams({
    user_id: String(data.user_id),
    game_mode: data.game_mode,
    map_group: data.map_group,
  });

  if (data.preferred_maps !== null) {
    query.set('preferred_maps', data.preferred_maps);
  }

  if (data.latency_ms !== null) {
    query.set('latency_ms', String(data.latency_ms));
  }

  return request<JoinQueueResponse>(`/queue/join?${query.toString()}`, {
    method: 'POST',
  });
}

/**
 * Удалить игрока из очереди матчмейкинга
 */
export async function leaveQueue(userId: number): Promise<LeaveQueueResponse> {
  const query = new URLSearchParams({
    user_id: String(userId),
  });

  return request<LeaveQueueResponse>(`/queue/leave?${query.toString()}`, {
    method: 'POST',
  });
}

/**
 * Получить текущее состояние очереди матчмейкинга
 */
export async function getQueueStatus(gameMode: string = '1v1'): Promise<QueueStatusResponse> {
  const query = new URLSearchParams({
    game_mode: gameMode,
  });

  return request<QueueStatusResponse>(`/queue/status?${query.toString()}`, {
    method: 'GET',
  });
}

/**
 * Проверить наличие активного подтверждения готовности (Ready Check)
 */
export async function getReadyCheck(userId: number): Promise<ReadyCheckResponse> {
  return request<ReadyCheckResponse>(`/queue/ready-check?user_id=${userId}`, {
    method: 'GET',
  });
}

/**
 * Принять или отклонить найденный матч
 */
export async function respondReadyCheck(
  readyCheckId: number,
  userId: number,
  accept: boolean,
): Promise<ReadyCheckResponse> {
  const query = new URLSearchParams({
    user_id: String(userId),
    accept: String(accept),
  });
  return request<ReadyCheckResponse>(`/queue/ready-check/${readyCheckId}/respond?${query.toString()}`, {
    method: 'POST',
  });
}
