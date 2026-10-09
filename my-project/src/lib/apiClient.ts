const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

const ONBOARDING_TOKEN_KEY = 'paws.onboarding.token';
const SESSION_KEY = 'paws.auth.session';

/**
 * The access/refresh JWT pair lives in httpOnly cookies (set by the backend
 * on login) so page JavaScript can never read them. What remains here:
 *
 * - the short-lived onboarding token (unchanged flow), and
 * - a boolean-style session flag: "this browser has logged in and not logged
 *   out". It carries no credentials — it only tells the app to attempt
 *   backend-first reads (cookies do the actual authenticating) instead of
 *   dropping straight to demo mocks after a reload.
 */
export const tokenStore = {
  getOnboarding: () => localStorage.getItem(ONBOARDING_TOKEN_KEY),
  setOnboarding: (token: string) => localStorage.setItem(ONBOARDING_TOKEN_KEY, token),
  clearOnboarding: () => localStorage.removeItem(ONBOARDING_TOKEN_KEY),
};

export const sessionStore = {
  has: () => localStorage.getItem(SESSION_KEY) === '1',
  mark: () => localStorage.setItem(SESSION_KEY, '1'),
  clear: () => localStorage.removeItem(SESSION_KEY),
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
  /** Internal: skip the expired-session refresh + retry (prevents loops). */
  noRefreshRetry?: boolean;
}

/** Single-flight session refresh so parallel 401s trigger only one rotation. */
let refreshInFlight: Promise<boolean> | null = null;

const tryRefreshSession = (): Promise<boolean> => {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('refresh failed');
      return true;
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
};

export const apiRequest = async <T>(
  path: string,
  { method = 'GET', body, auth = 'none' }: RequestOptions = {},
): Promise<T> => {
  const { data } = await apiRequestWithMeta<T>(path, { method, body, auth });
  return data;
};

export const apiRequestWithMeta = async <T>(
  path: string,
  { method = 'GET', body, auth = 'none', noRefreshRetry = false }: RequestOptions = {},
): Promise<{ data: T; meta?: ApiMeta }> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  // Only the onboarding flow still uses a Bearer token; full sessions travel
  // in httpOnly cookies, which `credentials: 'include'` attaches for us.
  if (auth === 'onboarding') {
    const token = tokenStore.getOnboarding();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      'Cannot reach the server. Is the backend running?',
      0,
      'NETWORK_ERROR',
    );
  }

  // An expired access token is not a logout: rotate the session once via the
  // refresh cookie and replay the request before surfacing a 401.
  if (res.status === 401 && auth === 'full' && !noRefreshRetry && sessionStore.has()) {
    try {
      const refreshed = await tryRefreshSession();
      if (refreshed) {
        return apiRequestWithMeta<T>(path, { method, body, auth, noRefreshRetry: true });
      }
    } catch {
      // Refresh rejected — the session is genuinely dead.
    }
    sessionStore.clear();
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
