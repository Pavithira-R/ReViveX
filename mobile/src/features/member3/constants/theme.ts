// ============================================================================
// Member 3 - Theme, Colors & Design System Tokens
// Aligned with ReViveX Circular Economy Brand Palette
// ============================================================================

import {
  DeviceCategory,
  DeviceCondition,
  DeviceAgeGroup,
  UserIntention,
  RecommendationAction,
} from '../types';

export const COLORS = {
  // Brand Circular Economy Greens
  primary: '#2E7D32',
  primaryDark: '#1B5E20',
  primaryLight: '#E8F5E9',
  primaryMuted: '#A5D6A7',

  // Secondary Accents
  repairTeal: '#0D9488',
  repairLight: '#F0FDFA',
  sellBlue: '#2563EB',
  sellLight: '#EFF6FF',
  donatePurple: '#7C3AED',
  donateLight: '#F5F3FF',
  reuseAmber: '#D97706',
  reuseLight: '#FFFBEB',
  recycleEmerald: '#059669',
  recycleLight: '#ECFDF5',

  // Semantic
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#DC2626',
  info: '#0284C7',

  // Neutrals
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  border: '#E2E8F0',
  borderDark: '#CBD5E1',

  // Typography
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Star Ratings & Badges
  starAmber: '#FBBF24',
  chipBg: '#F1F5F9',
  chipActiveBg: '#E8F5E9',
  chipActiveBorder: '#2E7D32',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const SHADOWS = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  hover: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
};

export const CATEGORY_META: Record<
  DeviceCategory,
  { label: string; icon: string; description: string }
> = {
  LAPTOP: { label: 'Laptop', icon: '💻', description: 'Notebooks, MacBooks, Chromebooks' },
  PHONE: { label: 'Smartphone', icon: '📱', description: 'iOS, Android smartphones' },
  TABLET: { label: 'Tablet', icon: '📲', description: 'iPads, Android & Windows tablets' },
  DESKTOP: { label: 'Desktop PC', icon: '🖥️', description: 'Towers, All-in-Ones, Mini PCs' },
  MONITOR: { label: 'Monitor', icon: '🖥️', description: 'Displays, TV screens' },
  PRINTER: { label: 'Printer', icon: '🖨️', description: 'Laser, Inkjet, Scanners' },
  OTHER: { label: 'Other Tech', icon: '🔌', description: 'Audio, Wearables, Accessories' },
};

export const CONDITION_META: Record<
  DeviceCondition,
  { label: string; badge: string; color: string; bgColor: string; description: string }
> = {
  WORKING_NORMALLY: {
    label: 'Working Normally',
    badge: 'Optimal',
    color: '#16A34A',
    bgColor: '#DCFCE7',
    description: 'Fully functional with no notable software or hardware defects',
  },
  WORKING_WITH_PROBLEMS: {
    label: 'Working with Problems',
    badge: 'Minor Issues',
    color: '#D97706',
    bgColor: '#FEF3C7',
    description: 'Powers on but has battery drain, lag, or intermittent faults',
  },
  NOT_WORKING: {
    label: 'Not Working',
    badge: 'Defective',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    description: 'Does not power on or has non-responsive motherboard/screen',
  },
  PHYSICALLY_DAMAGED: {
    label: 'Physically Damaged',
    badge: 'Hardware Damage',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    description: 'Cracked screen, broken casing, hinge issues, or liquid contact',
  },
};

export const AGE_META: Record<DeviceAgeGroup, { label: string; range: string }> = {
  LESS_THAN_1_YEAR: { label: '< 1 Year', range: 'Under 12 months' },
  ONE_TO_THREE_YEARS: { label: '1 – 3 Years', range: '1 to 3 years old' },
  THREE_TO_FIVE_YEARS: { label: '3 – 5 Years', range: '3 to 5 years old' },
  MORE_THAN_5_YEARS: { label: '> 5 Years', range: 'Over 5 years old' },
};

export const INTENTION_META: Record<
  UserIntention,
  { label: string; icon: string; description: string }
> = {
  KEEP_USE: {
    label: 'Keep & Continue Using',
    icon: '🔄',
    description: 'I want to maintain or repurpose this device for myself',
  },
  REPAIR: {
    label: 'Get It Repaired',
    icon: '🛠️',
    description: 'I want professional servicing or parts to restore functionality',
  },
  SELL: {
    label: 'Sell for Cash',
    icon: '💵',
    description: 'I want to list it on the marketplace for financial return',
  },
  GIVE_AWAY: {
    label: 'Donate / Give Away',
    icon: '🎁',
    description: 'I want to help a student, non-profit or community member',
  },
  DISPOSE_RESPONSIBLY: {
    label: 'Recycle Responsibly',
    icon: '♻️',
    description: 'I want certified safe e-waste recycling and zero landfill disposal',
  },
};

export const ACTION_THEMES: Record<
  RecommendationAction,
  {
    title: string;
    icon: string;
    badgeColor: string;
    bgColor: string;
    textColor: string;
    ctaLabel: string;
  }
> = {
  REPAIR: {
    title: 'Repair & Restore',
    icon: '🛠️',
    badgeColor: COLORS.repairTeal,
    bgColor: COLORS.repairLight,
    textColor: '#0F766E',
    ctaLabel: 'Find Repair Providers',
  },
  REUSE: {
    title: 'Repurpose & Reuse',
    icon: '🔄',
    badgeColor: COLORS.reuseAmber,
    bgColor: COLORS.reuseLight,
    textColor: '#B45309',
    ctaLabel: 'Explore Reuse Guides',
  },
  SELL: {
    title: 'Sell on Marketplace',
    icon: '🏷️',
    badgeColor: COLORS.sellBlue,
    bgColor: COLORS.sellLight,
    textColor: '#1D4ED8',
    ctaLabel: 'List for Sale',
  },
  DONATE: {
    title: 'Donate to Community',
    icon: '🎁',
    badgeColor: COLORS.donatePurple,
    bgColor: COLORS.donateLight,
    textColor: '#6D28D9',
    ctaLabel: 'Browse Donation Programs',
  },
  RECYCLE: {
    title: 'Responsible E-Waste Recycling',
    icon: '♻️',
    badgeColor: COLORS.recycleEmerald,
    bgColor: COLORS.recycleLight,
    textColor: '#047857',
    ctaLabel: 'Find E-Waste Drop-Offs',
  },
};
