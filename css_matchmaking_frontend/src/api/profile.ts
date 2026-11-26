import { request } from './client';
import type { ProfileUpdateRequest, UserProfileResponse } from './types';

/**
 * Получить данные профиля игрока по его ID
 */
export async function fetchProfile(userId: number): Promise<UserProfileResponse> {
  return request<UserProfileResponse>(`/profile/${userId}`);
}

/**
 * Получить данные профиля игрока по его никнейму
 */
export async function fetchProfileByName(username: string): Promise<UserProfileResponse | null> {
  try {
    return await request<UserProfileResponse>(`/profile/by-name/${encodeURIComponent(username)}`);
  } catch (err: unknown) {
    console.warn('[API] GET /profile/by-name — эндпоинт не реализован на бэкенде или профиль не найден:', err);
    return null;
  }
}

/**
 * Обновить данные профиля игрока
 */
export async function updateProfile(
  userId: number,
  data: ProfileUpdateRequest,
): Promise<UserProfileResponse> {
  return request<UserProfileResponse>(`/profile/${userId}`, {
    method: 'PATCH',
    bodyData: data,
  });
}
