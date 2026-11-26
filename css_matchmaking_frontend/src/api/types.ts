export interface UserProfileResponse {
  id: number;
  username: string;
  elo: number;
  matches_played: number;
  wins: number;
  losses: number;
  country?: string | null;
  avatar_url?: string | null;
  current_room_id?: number | null;
  last_played?: string | null;
}

export interface ProfileUpdateRequest {
  username?: string;
  avatar_url?: string;
  country?: string;
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

export interface RoomMutationResponse {
  room_id: number;
  status: string;
}

export interface ConnectCommandResponse {
  connect: string;
}

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

export interface MatchHistoryItem {
  id: number | string;
  map_name: string;
  game_mode: string;
  result?: string;
  score?: string;
  played_at?: string;
}

export interface LeaderboardEntry {
  id: number;
  username: string;
  elo: number;
  matches_played: number;
  wins: number;
  losses: number;
}

export interface GameServerInfo {
  id: number;
  name: string;
  ip: string;
  port: number;
  region: string | null;
  status: string;
  players: number;
}

export interface NotificationItem {
  id: number | string;
  title: string;
  message: string;
  created_at?: string;
  read: boolean;
}
