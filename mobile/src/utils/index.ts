import { ApiError } from '../services/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email: string): boolean => EMAIL_REGEX.test(email.trim());

/** Mirrors the backend rule: 8+ characters with at least one letter and one number. */
export const isValidPassword = (password: string): boolean =>
  password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);

/** Turn any thrown error into a message suitable for the UI. */
export const getErrorMessage = (error: unknown, fallback = 'Something went wrong. Please try again.'): string => {
  if (error instanceof ApiError) return error.displayMessage;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};
