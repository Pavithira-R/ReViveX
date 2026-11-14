import { normalizeEmail } from './validator.util';

/**
 * Brute-force protection for login.
 * After MAX_FAILED_ATTEMPTS wrong passwords for the same email from the same IP
 * within LOCK_DURATION_MS, further attempts are refused until the lock expires.
 * Kept in memory: enough for a single server; it resets when the server restarts.
 */
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_DURATION_MS = 15 * 60 * 1000;

interface AttemptRecord {
  failures: number;
  firstFailureAt: number;
  lockedUntil: number | null;
}

const attempts = new Map<string, AttemptRecord>();

export const loginAttemptKey = (ip: string | undefined, email: unknown): string =>
  `${ip ?? 'unknown'}|${typeof email === 'string' ? normalizeEmail(email) : ''}`;

/** Milliseconds until the lock ends, or 0 when login is allowed. */
export const getLoginLockRemainingMs = (key: string, now: number = Date.now()): number => {
  const record = attempts.get(key);
  if (!record) return 0;

  if (record.lockedUntil !== null) {
    if (now < record.lockedUntil) return record.lockedUntil - now;
    attempts.delete(key);
    return 0;
  }
  // Old failures outside the window no longer count.
  if (now - record.firstFailureAt > LOCK_DURATION_MS) attempts.delete(key);
  return 0;
};

export const recordFailedLogin = (key: string, now: number = Date.now()): void => {
  const record = attempts.get(key);
  if (!record || now - record.firstFailureAt > LOCK_DURATION_MS) {
    attempts.set(key, { failures: 1, firstFailureAt: now, lockedUntil: null });
    return;
  }
  record.failures += 1;
  if (record.failures >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCK_DURATION_MS;
  }
};

export const clearFailedLogins = (key: string): void => {
  attempts.delete(key);
};

/** Test helper: forget every recorded attempt. */
export const resetLoginAttempts = (): void => {
  attempts.clear();
};
