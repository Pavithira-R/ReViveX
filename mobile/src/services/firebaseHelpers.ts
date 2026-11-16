// Member 1 – Firebase setup: helpers every module uses
import { FirebaseError } from 'firebase/app';
import { DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import { ApiError } from './api';

/** Dates are stored as ISO text, like the rest of the app. */
export const nowIso = (): string => new Date().toISOString();

/** Member 2 – accepts an ISO string, a millisecond number or a Firestore Timestamp; returns ISO text. */
export const normalizeTimestamp = (value: unknown): string => {
  if (!value) return nowIso();
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return new Date(value).toISOString();
  if (typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return nowIso();
};

/**
 * `{ id, ...data }` for a Firestore document.
 * Throws a 404 ApiError when the document doesn't exist.
 */
export const withId = <T = Record<string, unknown>>(
  snapshot: DocumentSnapshot | QueryDocumentSnapshot
): T & { id: string } => {
  if (!snapshot.exists()) {
    throw new ApiError('Not found', 404, 'NOT_FOUND');
  }
  return { id: snapshot.id, ...(snapshot.data() as T) };
};

const NETWORK_CODES = new Set([
  'unavailable',
  'deadline-exceeded',
  'auth/network-request-failed',
]);

/**
 * Turn any Firebase error into the ApiError the screens already understand.
 * "No connection" becomes NETWORK_ERROR, so the offline banner and messages keep working.
 */
export const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) return error;
  const code = error instanceof FirebaseError ? error.code : '';

  if (NETWORK_CODES.has(code)) {
    return new ApiError(
      'Cannot reach the server. Check your internet connection and try again.',
      0,
      'NETWORK_ERROR'
    );
  }
  if (code === 'permission-denied') {
    return new ApiError('You are not allowed to do this.', 403, 'FORBIDDEN');
  }
  if (code === 'not-found') {
    return new ApiError('Not found', 404, 'NOT_FOUND');
  }
  return new ApiError('Something went wrong. Please try again.', 500, code || 'SERVER_ERROR');
};

/**
 * Run a Firestore/Auth call and convert its errors. Use around every Firebase call:
 *   const items = await fsCall(async () => (await getDocs(...)).docs.map(withId));
 */
export async function fsCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw toApiError(error);
  }
}
