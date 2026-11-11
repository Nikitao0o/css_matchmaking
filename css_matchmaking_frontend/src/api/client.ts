import { API_BASE_URL } from '@/api/config';

// Кастомный класс ошибки, чтобы мы могли видеть статус ответа (400, 404, 500 и т.д.)
export class ApiError extends Error {
  public status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions extends RequestInit {
  bodyData?: unknown; // Любые данные, которые мы хотим отправить (объект, массив и т.д.)
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { bodyData, headers, ...customConfig } = options;

  const method = customConfig.method ?? (bodyData ? 'POST' : 'GET');

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...customConfig,
  };

  if (bodyData !== undefined) {
    config.body = JSON.stringify(bodyData);
  }

  const fullUrl = endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? endpoint
    : `${API_BASE_URL.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;

  console.log(`[API REQUEST] ${method} ${fullUrl}`, bodyData ?? '');

  let response: Response;
  try {
    response = await fetch(fullUrl, config);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[API NETWORK ERROR] ${method} ${fullUrl}:`, errorMsg);
    throw new ApiError(
      0,
      `Не удалось подключиться к серверу (${fullUrl}). Убедитесь, что бэкенд запущен и доступен.`,
    );
  }

  console.log(`[API RESPONSE] ${response.status} ${fullUrl}`);

  if (!response.ok) {
    let errorMessage = `Ошибка запроса (${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson?.detail) {
        errorMessage = typeof errorJson.detail === 'string'
          ? errorJson.detail
          : JSON.stringify(errorJson.detail);
      }
    } catch {
      // Бэкенд вернул не JSON
    }

    throw new ApiError(response.status, errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
