import { UserRole } from '../types';

export const APP_NAME = 'ReViveX';
export const APP_TAGLINE = 'Repair. Reuse. Recycle.';

/**
 * Backend base URL.
 * Android (USB phone or emulator): forward the backend port to the device first:
 *   adb reverse tcp:5000 tcp:5000
 * so `localhost` on the device reaches the backend on your computer.
 * iOS simulator reaches localhost directly.
 */
export const API_BASE_URL = 'http://localhost:5000/api';

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
  surfaceSubtle: '#F1F5F9',
  primary: '#2E7D32',
  primaryDark: '#1B5E20',
  primaryLight: '#E8F5E9',
  secondary: '#3B82F6',
  accent: '#F59E0B',
  accentLight: '#FEF3C7',
  text: '#1C2421',
  textMuted: '#5F6B66',
  textSecondary: '#64748B',
  textWhite: '#FFFFFF',
  border: '#D5DED9',
  borderLight: '#F1F5F9',
  error: '#C62828',
  errorBg: '#FDECEA',
  danger: '#C62828',
  dangerLight: '#FDECEA',
  success: '#2E7D32',
  successLight: '#E8F5E9',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const FONT = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
};

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
};

