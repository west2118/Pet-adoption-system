const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

const TOKEN_KEY = 'paws.auth.token';
const ONBOARDING_TOKEN_KEY = 'paws.onboarding.token';

/**
 * Two token slots: a full session token for approved users, and a limited
 * onboarding token issued to shelter registrants before admin approval.
 */
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
  getOnboarding: () => localStorage.getItem(ONBOARDING_TOKEN_KEY),
  setOnboarding: (token: string) => localStorage.setItem(ONBOARDING_TOKEN_KEY, token),
  clearOnboarding: () => localStorage.removeItem(ONBOARDING_TOKEN_KEY),
};

export interface ApiFieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: ApiFieldError[];

  constructor(message: string, status: number, code = 'ERROR', details?: ApiFieldError[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: ApiMeta;
  error?: { code: string; message: string; details?: ApiFieldError[] };
}

type AuthMode = 'none' | 'full' | 'onboarding';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: AuthMode;
}

export const apiRequest = async <T>(
  path: string,
  { method = 'GET', body, auth = 'none' }: RequestOptions = {},
): Promise<T> => {
  const { data } = await apiRequestWithMeta<T>(path, { method, body, auth });
  return data;
};

export const apiRequestWithMeta = async <T>(
  path: string,
  { method = 'GET', body, auth = 'none' }: RequestOptions = {},
): Promise<{ data: T; meta?: ApiMeta }> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (auth !== 'none') {
    const token = auth === 'onboarding' ? tokenStore.getOnboarding() : tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      'Cannot reach the server. Is the backend running?',
      0,
      'NETWORK_ERROR',
    );
  }

  const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!res.ok || !json || json.success === false) {
    const error = json?.error;
    throw new ApiError(
      error?.message ?? `Request failed (${res.status})`,
      res.status,
      error?.code ?? 'ERROR',
      error?.details,
    );
  }

  return { data: json.data as T, meta: json.meta };
};
