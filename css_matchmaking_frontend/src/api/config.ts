/**
 * Конфигурация подключения к Backend API.
 * Напрямую адресует FastAPI бэкенд на порту 8000 по умолчанию.
 */
const envApiUrl = import.meta.env.VITE_API_URL;

export const API_BASE_URL: string =
  envApiUrl !== undefined && envApiUrl !== ''
    ? envApiUrl
    : 'http://localhost:8000';
