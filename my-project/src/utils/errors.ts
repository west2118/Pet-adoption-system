import { ApiError } from '@/lib/apiClient';

/**
 * Turns an API failure into a sentence a visitor can act on, instead of
 * leaking transport details. The server's own message is used when it is
 * meaningful (e.g. a validation rule), otherwise a status-based explanation.
 */
export const describeApiError = (
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string => {
  if (!(error instanceof ApiError)) return fallback;

  if (error.status === 0) {
    return 'We cannot reach the server right now. Check your connection and try again.';
  }
  if (error.status === 401) {
    return 'Your session has expired. Please sign in again to continue.';
  }
  if (error.status === 403) {
    return 'You do not have permission to view this.';
  }
  if (error.status === 404) {
    return 'We could not find what you were looking for.';
  }
  if (error.status >= 500) {
    return 'The server ran into a problem. Please try again in a moment.';
  }
  return error.message || fallback;
};
