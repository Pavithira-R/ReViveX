export type UserRole =
  | 'ITEM_OWNER'
  | 'SERVICE_PROVIDER'
  | 'BUYER'
  | 'RECYCLER'
  | 'ADMIN';

/** Roles a user may pick when registering (ADMIN accounts are seeded on the backend). */
export const PUBLIC_ROLES: UserRole[] = [
  'ITEM_OWNER',
  'SERVICE_PROVIDER',
  'BUYER',
  'RECYCLER',
];

/** Matches the backend `SafeUser` returned by /auth and /users/me. */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  profileImage: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  phone?: string;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string | null;
  profileImage?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface AuthResult {
  token: string;
  user: User;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Standard backend response envelope. */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T | null;
  error: { code: string; details?: string[] } | null;
}
