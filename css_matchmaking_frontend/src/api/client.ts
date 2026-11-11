// custom class for errors, so we can see the response status (400, 404, 500 etc.)
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

  const config: RequestInit = {
    method: customConfig.method ?? (bodyData ? 'POST' : 'GET'),
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...customConfig,
  };

  if (bodyData !== undefined) {
    config.body = JSON.stringify(bodyData);
  }

  // Благодаря proxy в vite.config.ts мы можем указывать относительные пути: "/profile/1", "/dev/login"
  const response = await fetch(endpoint, config);

  if (!response.ok) {
    // Пытаемся достать сообщение об ошибке, которое FastAPI отдает в поле `detail`
    let errorMessage = `Ошибка запроса (${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson?.detail) {
        errorMessage = typeof errorJson.detail === 'string' 
          ? errorJson.detail 
          : JSON.stringify(errorJson.detail);
      }
    } catch {
      // Если бэкенд вернул не JSON, оставляем статус
    }

    throw new ApiError(response.status, errorMessage);
  }

  // Если ответ пустой (например, 204 No Content), возвращаем пустой объект
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}