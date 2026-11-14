import { UserRole } from '../types';

export const APP_NAME = 'ReViveX';
export const APP_TAGLINE = 'Repair. Reuse. Recycle.';

export const API_BASE_URL = '/api';

export const ROLES = {
  ITEM_OWNER: 'ITEM_OWNER',
  SERVICE_PROVIDER: 'SERVICE_PROVIDER',
  BUYER: 'BUYER',
  RECYCLER: 'RECYCLER',
  ADMIN: 'ADMIN',
} as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  ITEM_OWNER: 'Item Owner',
  SERVICE_PROVIDER: 'Service Provider',
  BUYER: 'Buyer / Reuser',
  RECYCLER: 'Recycler',
  ADMIN: 'Admin',
};

export const COLORS = {
  background: '#F4F7F5',
  surface: '#FFFFFF',
  primary: '#2E7D32',
  primaryDark: '#1B5E20',
  primaryLight: '#E8F5E9',
  text: '#1C2421',
  textMuted: '#5F6B66',
  border: '#D5DED9',
  error: '#C62828',
  errorBg: '#FDECEA',
  success: '#2E7D32',
};
