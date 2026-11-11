import { request } from '@/api/client';
import { WS_BASE_URL } from '@/api/config';

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

// Типы сообщений из WebSocket матчмейкинга
export interface QueuedWsMessage {
  type: 'queued';
  position: number;
}

export interface MatchReadyWsMessage {
  type: 'match_ready';
  room_id: number;
  connect: string;
  map: string;
}

export type MatchmakingWsMessage = QueuedWsMessage | MatchReadyWsMessage;

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

// ==========================================
// 3. WebSocket соединение матчмейкинга
// ==========================================

/**
 * Открыть WebSocket подключение к очереди матчмейкинга
 */
export function openMatchmakingSocket(
  userId: number,
  onMessage: (data: MatchmakingWsMessage) => void,
  onError?: (event: Event) => void,
  onClose?: (event: CloseEvent) => void,
): WebSocket {
  const wsUrl = `${WS_BASE_URL.replace(/\/+$/, '')}/ws/matchmaking?user_id=${userId}`;
  console.log(`[WS CONNECTING] ${wsUrl}`);
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log(`[WS CONNECTED] ${wsUrl}`);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as MatchmakingWsMessage;
      console.log(`[WS MESSAGE]`, data);
      onMessage(data);
    } catch (e) {
      console.error('[WS PARSE ERROR]', e);
    }
  };

  ws.onerror = (event) => {
    console.error(`[WS ERROR] ${wsUrl}:`, event);
    if (onError) onError(event);
  };

  ws.onclose = (event) => {
    console.log(`[WS CLOSED] code: ${event.code}, reason: ${event.reason}`);
    if (onClose) onClose(event);
  };

  return ws;
}
