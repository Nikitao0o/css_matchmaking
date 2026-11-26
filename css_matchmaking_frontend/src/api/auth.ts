import { request } from './client';
import { API_BASE_URL } from './config';
import type { DevCreateUserResponse, DevLoginResponse } from './types';

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
 * Получить URL для авторизации через Steam
 */
export function getSteamLoginUrl(): string {
  return `${API_BASE_URL.replace(/\/+$/, '')}/login`;
}
