import { apiRequest } from './api';
import {
  AuthResult,
  LoginCredentials,
  Paginated,
  RegisterData,
  UpdateProfileData,
  User,
  UserRole,
} from '../types';

export const authService = {
  register: (data: RegisterData) => apiRequest<AuthResult>('POST', '/auth/register', data),

  login: (credentials: LoginCredentials) =>
    apiRequest<AuthResult>('POST', '/auth/login', credentials),

  logout: () => apiRequest<null>('POST', '/auth/logout'),

  getMe: () => apiRequest<User>('GET', '/users/me'),

  updateMe: (data: UpdateProfileData) => apiRequest<User>('PUT', '/users/me', data),
};

export interface AdminUserFilters {
  role?: UserRole;
  search?: string;
  page?: number;
  limit?: number;
}

export const adminService = {
  listUsers: (filters: AdminUserFilters = {}) => {
    const params = Object.entries(filters)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&');
    return apiRequest<Paginated<User>>('GET', `/admin/users${params ? `?${params}` : ''}`);
  },

  changeRole: (userId: string, role: UserRole) =>
    apiRequest<User>('PATCH', `/admin/users/${userId}/role`, { role }),

  setActive: (userId: string, isActive: boolean) =>
    apiRequest<User>('PATCH', `/admin/users/${userId}/status`, { isActive }),
};
