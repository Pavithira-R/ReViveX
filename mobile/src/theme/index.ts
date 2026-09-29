// ============================================================================
// ReViveX Mobile Design Tokens & Theme
// Clean, modern, vibrant circular-economy aesthetic (Emerald green, Slate, Amber)
// ============================================================================

export const Colors = {
  primary: '#0D9488', // Teal / Emerald for sustainability & circular economy
  primaryDark: '#0F766E',
  primaryLight: '#CCFBF1',
  secondary: '#3B82F6', // Trust & repair blue
  secondaryLight: '#EFF6FF',
  accent: '#F59E0B', // Amber for ratings & pending status
  accentLight: '#FEF3C7',
  success: '#10B981', // Green for completed & verified
  successLight: '#D1FAE5',
  danger: '#EF4444', // Red for rejected & errors
  dangerLight: '#FEE2E2',
  warning: '#F97316',
  
  // Background & Surface
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceCard: '#FFFFFF',
  surfaceSubtle: '#F1F5F9',
  
  // Text
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textWhite: '#FFFFFF',
  
  // Borders & Dividers
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocus: '#0D9488',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Typography = {
  fontSizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
  },
  fontWeights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const Shadows = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};
