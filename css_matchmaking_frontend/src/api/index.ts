import { request } from '@/api/client';

// 1. Описываем типы ответов от бэкенда (соответствуют возвращаемым данным FastAPI)
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

// 2. Функции запросов

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