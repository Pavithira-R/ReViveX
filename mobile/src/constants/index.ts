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

// Member 6 – Shared design system (colours, spacing, type, corners, shadows) used by every screen.
export const COLORS = {
  background: '#F3F6F4',
  surface: '#FFFFFF',
  surfaceMuted: '#F8FAF9',
  primary: '#2E7D32',
  primaryDark: '#1B5E20',
  primaryLight: '#E8F5E9',
  accent: '#00897B',
  text: '#16201B',
  textMuted: '#5F6B66',
  border: '#DCE4DF',
  error: '#C62828',
  errorBg: '#FDECEA',
  success: '#2E7D32',
  warning: '#B26A00',
  warningBg: '#FFF4E0',
  /** Soft tints for icon circles on tiles. */
  tint: {
    green: '#E3F2E5',
    teal: '#DDF2EF',
    blue: '#E3EEFB',
    amber: '#FDF0D9',
    purple: '#EEE7F8',
    rose: '#FBE6E8',
  },
  /** Icon colour that goes with each tint. */
  tintIcon: {
    green: '#2E7D32',
    teal: '#00796B',
    blue: '#1565C0',
    amber: '#B26A00',
    purple: '#6A1B9A',
    rose: '#C2185B',
  },
};

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 24, round: 999 };

export const FONT = {
  title: 26,
  heading: 20,
  subheading: 17,
  body: 15,
  small: 13,
  tiny: 11,
};

/** Soft card shadow (Android elevation + iOS shadow). */
export const SHADOW = {
  card: {
    elevation: 2,
    shadowColor: '#0B2A14',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  raised: {
    elevation: 6,
    shadowColor: '#0B2A14',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
};
