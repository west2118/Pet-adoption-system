const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

/**
 * Sessions are owned entirely by the backend: the access/refresh JWTs live in
 * httpOnly cookies set on login, so no credential is ever readable by page
 * JavaScript. Whether a visitor is signed in is answered by the API itself
 * (`GET /auth/me` behind the `authenticate` middleware) — never by a local
 * flag — and a 401 is what tells the app there is no session.
 */
export interface ApiFieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: any;

  constructor(message: string, status: number, code = 'ERROR', details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Message to show for a failed request: the server's own message when we have
 * one, otherwise the caller's wording for an unexpected failure.
 */
export const apiErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof ApiError ? error.message : fallback;

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
/**
 * After a rejected rotation there is no session, so further probe refreshes
 * are pointless for a short while (e.g. a guest browsing demo screens that
 * fire several protected reads at once).
 */
let refreshBlockedUntil = 0;
const REFRESH_COOLDOWN_MS = 15_000;

const tryRefreshSession = (): Promise<boolean> => {
  if (Date.now() < refreshBlockedUntil) return Promise.resolve(false);
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) {
          refreshBlockedUntil = Date.now() + REFRESH_COOLDOWN_MS;
          return false;
        }
        refreshBlockedUntil = 0;
        return true;
      } catch {
        // Network failure while rotating: treat it as "no session" for now
        // and let the original 401 reach the caller.
        refreshBlockedUntil = Date.now() + REFRESH_COOLDOWN_MS;
        return false;
      }
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

  let res: Response;
  try {
    // `credentials: 'include'` attaches the httpOnly session cookies.
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
  // refresh cookie and replay the request before surfacing a 401. With no
  // session the rotation is rejected and the 401 reaches the caller.
  if (res.status === 401 && auth === 'full' && !noRefreshRetry) {
    if (await tryRefreshSession()) {
      return apiRequestWithMeta<T>(path, { method, body, auth, noRefreshRetry: true });
    }
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
