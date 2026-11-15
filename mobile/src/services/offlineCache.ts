// Member 6 – Offline mode
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiError } from './api';
import { User } from '../types';

/**
 * Offline-first reading: every successful load is saved on the phone, and when the
 * server can't be reached the saved copy is shown instead (with the time it was saved).
 *
 *   const result = await withOfflineCache('notifications', notificationService.list);
 *   result.data       // fresh data, or the saved copy
 *   result.fromCache  // true when offline
 *   result.savedAt    // when the saved copy was made
 *
 * Saved copies belong to the signed-in user and are deleted on logout.
 */

const PREFIX = 'revivex.cache.';
const LAST_USER_KEY = `${PREFIX}lastUser`;

let cacheUserId: string | null = null;

export interface CachedResult<T> {
  data: T;
  fromCache: boolean;
  savedAt: string | null;
}

interface SavedEntry<T> {
  savedAt: string;
  data: T;
}

/** True for "cannot reach the server" errors (no connection, server down). */
export const isOfflineError = (error: unknown): boolean =>
  error instanceof ApiError && error.code === 'NETWORK_ERROR';

const keyFor = (key: string): string | null => (cacheUserId ? `${PREFIX}${cacheUserId}.${key}` : null);

const readEntry = async <T,>(storageKey: string): Promise<SavedEntry<T> | null> => {
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as SavedEntry<T>) : null;
  } catch {
    return null;
  }
};

const writeEntry = async <T,>(storageKey: string, data: T): Promise<void> => {
  try {
    const entry: SavedEntry<T> = { savedAt: new Date().toISOString(), data };
    await AsyncStorage.setItem(storageKey, JSON.stringify(entry));
  } catch {
    // Saving is best-effort: the app works without it.
  }
};

/** Load from the server; when offline, fall back to the last saved copy. */
export async function withOfflineCache<T>(
  key: string,
  load: () => Promise<T>
): Promise<CachedResult<T>> {
  const storageKey = keyFor(key);
  try {
    const data = await load();
    if (storageKey) await writeEntry(storageKey, data);
    return { data, fromCache: false, savedAt: null };
  } catch (error) {
    if (!isOfflineError(error) || !storageKey) throw error;
    const saved = await readEntry<T>(storageKey);
    if (!saved) throw error;
    return { data: saved.data, fromCache: true, savedAt: saved.savedAt };
  }
}

/** Remember who is signed in, so the app can open with saved data when offline. */
export const rememberUser = async (user: User): Promise<void> => {
  cacheUserId = user.id;
  await writeEntry(LAST_USER_KEY, user);
};

/** The last signed-in user, or null. Used when the app starts without internet. */
export const recallUser = async (): Promise<User | null> => {
  const saved = await readEntry<User>(LAST_USER_KEY);
  if (saved?.data) cacheUserId = saved.data.id;
  return saved?.data ?? null;
};

/** Delete every saved copy (on logout or when the session expires). */
export const clearOfflineData = async (): Promise<void> => {
  cacheUserId = null;
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
    if (keys.length) await AsyncStorage.removeMany(keys);
  } catch {
    // Nothing to clear.
  }
};
