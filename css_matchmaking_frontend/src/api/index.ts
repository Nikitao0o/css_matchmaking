import { request } from '@/api/client';

// ==========================================
// 1. Типы ответов бэкенда
// ==========================================

export interface UserProfileResponse {
  id: number;
  username: string;
  elo: number;
  matches_played: number;
  wins: number;
  losses: number;
}

export interface DevLoginResponse {
  user_id: number;
  steam_id: string;
  username: string;
}

export interface DevCreateUserResponse {
  user_id: number;
  steam_id: string;
}

export interface RoomPlayer {
  id: number;
  username: string;
}

export interface RoomResponse {
  id: number;
  status: string;
  game_mode: string;
  map_name: string;
  bot_quota: number;
  players: RoomPlayer[];
}

export interface ConnectCommandResponse {
  connect: string;
}

// ==========================================
// 2. HTTP-запросы
// ==========================================

/**
 * Получить данные профиля игрока по его ID
 */
export async function fetchProfile(userId: number): Promise<UserProfileResponse> {
  return request<UserProfileResponse>(`/profile/${userId}`);
}

/**
 * Авторизоваться тестовым пользователем (Dev endpoint)
 */
export async function devLogin(userId: number): Promise<DevLoginResponse> {
  return request<DevLoginResponse>(`/dev/login?user_id=${userId}`, {
    method: 'POST',
  });
}

/**
 * Создать нового тестового пользователя (Dev endpoint)
 */
export async function devCreateUser(username: string): Promise<DevCreateUserResponse> {
  return request<DevCreateUserResponse>(`/dev/create-user?username=${encodeURIComponent(username)}`, {
    method: 'POST',
  });
}

/**
 * Создать новую комнату для матча
 */
export async function createRoom(
  userId: number,
  gameMode: string = '1v1',
  mapName: string = 'de_dust2',
): Promise<{ room_id: number; status: string }> {
  const query = new URLSearchParams({
    user_id: String(userId),
    game_mode: gameMode,
    map_name: mapName,
  });
  return request<{ room_id: number; status: string }>(`/rooms/create?${query.toString()}`, {
    method: 'POST',
  });
}

// Типы для очереди матчмейкинга
export interface JoinQueueRequest {
  user_id: number;
  game_mode: string;
  map_group: string;
  preferred_maps: string | null;
  latency_ms: number | null;
}

export interface JoinQueueResponse {
  queued: boolean;
  queue_size: number;
}

export interface LeaveQueueResponse {
  left: boolean;
}

export interface QueueStatusPlayer {
  user_id: number;
  elo: number;
  waiting_s: number;
}

export interface QueueStatusResponse {
  game_mode: string;
  count: number;
  players: QueueStatusPlayer[];
}

// Добавление игрока в очередь
export async function joinQueue(
  data: JoinQueueRequest
): Promise<JoinQueueResponse> {
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

  return request<JoinQueueResponse>(
    `/queue/join?${query.toString()}`,
    { method: 'POST' }
  );
}

// Выход игрока из очереди
export async function leaveQueue(
  userId: number
): Promise<LeaveQueueResponse> {
  const query = new URLSearchParams({
    user_id: String(userId),
  });

  return request<LeaveQueueResponse>(
    `/queue/leave?${query.toString()}`,
    { method: 'POST' }
  );
}

// Получение состояния очереди
export async function getQueueStatus(
  gameMode: string = '1v1'
): Promise<QueueStatusResponse> {
  const query = new URLSearchParams({
    game_mode: gameMode,
  });

  return request<QueueStatusResponse>(
    `/queue/status?${query.toString()}`,
    { method: 'GET' }
  );
}

/**
 * Присоединиться к существующей комнате
 */
export async function joinRoom(
  roomId: number,
  userId: number,
): Promise<{ room_id: number; status: string }> {
  return request<{ room_id: number; status: string }>(`/rooms/${roomId}/join?user_id=${userId}`, {
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
 * Получить команду консоли для подключения к игровому серверу (например "connect 127.0.0.1:27015")
 */
export async function fetchConnectCommand(roomId: number): Promise<ConnectCommandResponse> {
  return request<ConnectCommandResponse>(`/rooms/${roomId}/connect`);
}

/**
 * Запустить матч в комнате (админ/серверный триггер)
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
