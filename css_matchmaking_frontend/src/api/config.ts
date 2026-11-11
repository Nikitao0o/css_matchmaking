/**
 * Конфигурация подключения к Backend API и WebSocket.
 * Напрямую адресует FastAPI бэкенд на порту 8000 по умолчанию.
 */
const envApiUrl = import.meta.env.VITE_API_URL;
const envWsUrl = import.meta.env.VITE_WS_URL;

export const API_BASE_URL: string =
  envApiUrl !== undefined && envApiUrl !== ''
    ? envApiUrl
    : 'http://localhost:8000';

export const WS_BASE_URL: string =
  envWsUrl !== undefined && envWsUrl !== ''
    ? envWsUrl
    : 'ws://localhost:8000';
