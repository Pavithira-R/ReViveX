import {
  RegisterDTO,
  LoginDTO,
  UpdateProfileDTO,
  UserRole,
  PUBLIC_ROLES,
  ALL_ROLES,
} from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

const NAME_MAX_LENGTH = 100;
const PHONE_REGEX = /^\+?[0-9\s-]{7,20}$/;
const URL_REGEX = /^https?:\/\/\S+$/i;

/**
 * Validate an email address format.
 */
export const isValidEmail = (email: unknown): boolean => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Normalize an email address by trimming and converting to lowercase.
 */
export const normalizeEmail = (email: string): string => {
  return email ? email.trim().toLowerCase() : '';
};

/**
 * Validate password strength.
 * Minimum 8 characters, at least 1 letter and 1 number.
 */
export const isValidPassword = (password: unknown): boolean => {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasLetter && hasNumber;
};

export const isValidRole = (role: unknown): role is UserRole =>
  typeof role === 'string' && ALL_ROLES.includes(role as UserRole);

const validateName = (name: unknown, errors: string[]): void => {
  if (typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Name is required');
  } else if (name.trim().length > NAME_MAX_LENGTH) {
    errors.push(`Name must be at most ${NAME_MAX_LENGTH} characters`);
  }
};

const validatePhone = (phone: unknown, errors: string[]): void => {
  if (phone === undefined || phone === null || phone === '') return;
  if (typeof phone !== 'string' || !PHONE_REGEX.test(phone.trim())) {
    errors.push('Phone number is invalid');
  }
};

/**
 * Validate registration payload.
 */
export const validateRegisterInput = (
  input: Partial<RegisterDTO>
): ValidationResult => {
  const errors: string[] = [];

  validateName(input.name, errors);

  if (!isValidEmail(input.email)) {
    errors.push('A valid email address is required');
  }

  if (!input.password) {
    errors.push('Password is required');
  } else if (!isValidPassword(input.password)) {
    errors.push('Password must be at least 8 characters and contain both letters and numbers');
  }

  if (input.role !== undefined) {
    if (input.role === 'ADMIN') {
      errors.push('Registration as ADMIN is not allowed through public registration');
    } else if (!PUBLIC_ROLES.includes(input.role as UserRole)) {
      errors.push(`Role must be one of: ${PUBLIC_ROLES.join(', ')}`);
    }
  }

  validatePhone(input.phone, errors);

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate login payload.
 */
export const validateLoginInput = (
  input: Partial<LoginDTO>
): ValidationResult => {
  const errors: string[] = [];

  if (!isValidEmail(input.email)) {
    errors.push('A valid email address is required');
  }

  if (!input.password || typeof input.password !== 'string') {
    errors.push('Password is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const UPDATABLE_PROFILE_FIELDS = ['name', 'phone', 'profileImage', 'latitude', 'longitude'];
const PROTECTED_PROFILE_FIELDS = ['role', 'email', 'password', 'passwordHash', 'isActive', 'id'];

/**
 * Validate a profile update payload.
 * Only name, phone, profileImage, latitude and longitude may be changed by the user.
 */
export const validateProfileUpdate = (
  input: UpdateProfileDTO
): ValidationResult => {
  const errors: string[] = [];

  const protectedFields = Object.keys(input).filter((key) =>
    PROTECTED_PROFILE_FIELDS.includes(key)
  );
  if (protectedFields.length > 0) {
    errors.push(`These fields cannot be changed here: ${protectedFields.join(', ')}`);
  }

  const knownFields = Object.keys(input).filter((key) =>
    UPDATABLE_PROFILE_FIELDS.includes(key)
  );
  if (knownFields.length === 0 && protectedFields.length === 0) {
    errors.push(`Provide at least one of: ${UPDATABLE_PROFILE_FIELDS.join(', ')}`);
  }

  if (input.name !== undefined) validateName(input.name, errors);
  validatePhone(input.phone, errors);

  if (input.profileImage !== undefined && input.profileImage !== null && input.profileImage !== '') {
    if (typeof input.profileImage !== 'string' || !URL_REGEX.test(input.profileImage)) {
      errors.push('Profile image must be an http(s) URL');
    }
  }

  const hasLat = input.latitude !== undefined && input.latitude !== null;
  const hasLng = input.longitude !== undefined && input.longitude !== null;
  if (hasLat !== hasLng) {
    errors.push('Latitude and longitude must be provided together');
  }
  if (hasLat && (typeof input.latitude !== 'number' || input.latitude < -90 || input.latitude > 90)) {
    errors.push('Latitude must be a number between -90 and 90');
  }
  if (hasLng && (typeof input.longitude !== 'number' || input.longitude < -180 || input.longitude > 180)) {
    errors.push('Longitude must be a number between -180 and 180');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
