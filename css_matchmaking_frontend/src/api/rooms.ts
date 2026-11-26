import { request } from './client';
import type { ConnectCommandResponse, RoomMutationResponse, RoomResponse } from './types';

/**
 * Создать новую комнату для матча
 */
export async function createRoom(
  userId: number,
  gameMode: string = '1v1',
  mapName: string = 'de_dust2',
): Promise<RoomMutationResponse> {
  const query = new URLSearchParams({
    user_id: String(userId),
    game_mode: gameMode,
    map_name: mapName,
  });
  return request<RoomMutationResponse>(`/rooms/create?${query.toString()}`, {
    method: 'POST',
  });
}

/**
 * Присоединиться к существующей комнате
 */
export async function joinRoom(
  roomId: number,
  userId: number,
): Promise<RoomMutationResponse> {
  return request<RoomMutationResponse>(`/rooms/${roomId}/join?user_id=${userId}`, {
    method: 'POST',
  });
}

/**
 * Покинуть комнату
 */
export async function leaveRoom(roomId: number, userId: number): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/rooms/${roomId}/leave?user_id=${userId}`, {
    method: 'POST',
  });
}

/**
 * Получить актуальное состояние комнаты по ее ID
 */
export async function fetchRoom(roomId: number): Promise<RoomResponse> {
  return request<RoomResponse>(`/rooms/${roomId}`);
}

/**
 * Получить команду консоли для подключения к игровому серверу
 */
export async function fetchConnectCommand(roomId: number): Promise<ConnectCommandResponse> {
  return request<ConnectCommandResponse>(`/rooms/${roomId}/connect`);
}

/**
 * Запустить матч в комнате
 */
export async function startMatch(
  roomId: number,
  mapName: string = 'de_dust2',
  gameMode: string = '1v1',
  botQuota: number = 0,
): Promise<{ ok: boolean; result: unknown }> {
  const query = new URLSearchParams({
    map_name: mapName,
    game_mode: gameMode,
    bot_quota: String(botQuota),
  });
  return request<{ ok: boolean; result: unknown }>(`/rooms/${roomId}/start?${query.toString()}`, {
    method: 'POST',
  });
}

/**
 * Завершить матч в комнате
 */
export async function endMatch(roomId: number): Promise<{ ok: boolean; result: unknown }> {
  return request<{ ok: boolean; result: unknown }>(`/rooms/${roomId}/end`, {
    method: 'POST',
  });
}
