import { Request } from 'express';

export type UserRole =
  | 'ITEM_OWNER'
  | 'SERVICE_PROVIDER'
  | 'BUYER'
  | 'RECYCLER'
  | 'ADMIN';

export const ALL_ROLES: UserRole[] = [
  'ITEM_OWNER',
  'SERVICE_PROVIDER',
  'BUYER',
  'RECYCLER',
  'ADMIN',
];

/** Roles a user may pick during public registration (ADMIN is seeded only). */
export const PUBLIC_ROLES: UserRole[] = [
  'ITEM_OWNER',
  'SERVICE_PROVIDER',
  'BUYER',
  'RECYCLER',
];

/**
 * The authenticated user attached to `req.user` by the `authenticate` middleware.
 * Other modules should read `req.user.id` and `req.user.role`.
 */
export interface AuthUser {
  id: string;
  role: UserRole;
  email: string;
  name: string;
}

/** Claims stored inside the JWT. `sub` holds the user id. */
export interface TokenClaims {
  sub: string;
  role: UserRole;
  email: string;
  name: string;
}

/** User data that is safe to return to the owner of the account (no password hash). */
export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  profileImage: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/** User data that is safe to show to *other* users (no email, phone or exact location). */
export interface PublicUser {
  id: string;
  name: string;
  role: UserRole;
  profileImage: string | null;
  createdAt: Date | string;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  phone?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface UpdateProfileDTO {
  name?: string;
  phone?: string | null;
  profileImage?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  [key: string]: unknown;
}

export interface AuthResult {
  token: string;
  user: SafeUser;
}

export interface UserListQuery {
  role?: string;
  search?: string;
  isActive?: string;
  page?: string;
  limit?: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/** Kept for compatibility; every Express Request now carries an optional `user`. */
export type AuthenticatedRequest = Request;
