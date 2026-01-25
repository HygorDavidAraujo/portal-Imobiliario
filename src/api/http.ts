type ApiErrorPayload = {
  message?: string;
  error?: string;
  detail?: string;
  details?: string[];
  code?: string;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, opts?: { code?: string; details?: unknown }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = opts?.code;
    this.details = opts?.details;
  }
}

const parseErrorMessage = async (response: Response, fallback: string) => {
  try {
    const data = (await response.json()) as ApiErrorPayload;
    if (data?.message) return { message: data.message, code: data.code, details: data.details ?? data.detail };
    if (data?.error) return { message: data.error, code: data.code, details: data.details ?? data.detail };
    if (data?.detail) return { message: data.detail, code: data.code, details: data.details };
    if (Array.isArray(data?.details) && data.details.length) return { message: data.details.join('\n'), code: data.code, details: data.details };
  } catch {
    // ignore
  }
  return { message: fallback };
};

export const apiFetch = async <T>(
  path: string,
  opts?: {
    baseUrl?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    auth?: boolean;
    signal?: AbortSignal;
    fallbackErrorMessage?: string;
  }
): Promise<T> => {
  const baseUrl = opts?.baseUrl ?? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000');
  const url = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

  const headers: Record<string, string> = {
    ...(opts?.headers || {}),
  };

  if (opts?.auth) {
    const token = localStorage.getItem('adminToken');
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const body = opts?.body;
  const shouldJson = body != null && !(body instanceof FormData);
  if (shouldJson) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const response = await fetch(url, {
    method: opts?.method || (body != null ? 'POST' : 'GET'),
    headers,
    body: body == null ? undefined : shouldJson ? JSON.stringify(body) : body,
    signal: opts?.signal,
  });

  if (!response.ok) {
    const fallback = opts?.fallbackErrorMessage || 'Falha na requisição.';
    const parsed = await parseErrorMessage(response, fallback);
    throw new ApiError(parsed.message, response.status, { code: parsed.code, details: parsed.details });
  }

  // No content
  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  // Fallback text
  return (await response.text()) as unknown as T;
};
