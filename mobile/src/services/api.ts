import { API_BASE_URL } from '../constants';
import { ApiEnvelope } from '../types';

/** Error thrown for any failed API call; carries the backend error code and details. */
export class ApiError extends Error {
  status: number;
  code: string;
  details: string[];

  constructor(message: string, status: number, code: string, details: string[] = []) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Human-friendly text: validation details when present, otherwise the message. */
  get displayMessage(): string {
    return this.details.length > 0 ? this.details.join('\n') : this.message;
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

/** Called by AuthContext after login/logout. Shared by every module's API calls. */
export const setAuthToken = (token: string | null): void => {
  authToken = token;
};

/** Called by AuthContext so an expired/invalid token signs the user out everywhere. */
export const setUnauthorizedHandler = (handler: (() => void) | null): void => {
  onUnauthorized = handler;
};

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Make a request to the ReViveX backend and unwrap `{ success, data }`.
 * Other members can reuse this: `apiRequest<Item[]>('GET', '/items')`.
 */
export async function apiRequest<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      'Cannot reach the server. Check your connection and that the backend is running.',
      0,
      'NETWORK_ERROR'
    );
  }

  let envelope: ApiEnvelope<T> | null = null;
  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    // Non-JSON response (e.g. proxy error page)
  }

  if (!response.ok || !envelope?.success) {
    // Only an authenticated request that is rejected means the session is no longer valid.
    if (response.status === 401 && authToken && onUnauthorized) {
      onUnauthorized();
    }
    throw new ApiError(
      envelope?.message || `Request failed (${response.status})`,
      response.status,
      envelope?.error?.code || 'UNKNOWN_ERROR',
      envelope?.error?.details || []
    );
  }

  return envelope.data as T;
}
