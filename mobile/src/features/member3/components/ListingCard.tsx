// ============================================================================
// Member 3 - ListingCard Component
// Marketplace & Donation Listing card (Member 5 Integration)
// ============================================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ListingSummary, RecommendationAction, DeviceCategory, DeviceCondition } from '../types';
import {
  ACTION_THEMES,
  NEUTRAL_ACTION_THEME,
  CATEGORY_META,
  CONDITION_META,
  COLORS,
  RADIUS,
  SHADOWS,
  SPACING,
} from '../constants/theme';
import { formatDistance } from '../utils/location';

interface ListingCardProps {
  listing: ListingSummary;
  onPress?: () => void;
  compact?: boolean;
}

const safeString = (val: unknown, fallback: string): string => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    if (typeof obj.name === 'string') return obj.name;
    if (typeof obj.city === 'string') return obj.city;
    if (typeof obj.address === 'string') return obj.address;
    if (typeof obj.title === 'string') return obj.title;
    if (typeof obj.label === 'string') return obj.label;
  }
  return fallback;
};

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onPress,
  compact = false,
}) => {
  if (!listing) return null;

  // Robust action normalization: check actionType, type, or action
  const rawActionStr = (listing.actionType || (listing as any).type || (listing as any).action || '')
    .toString()
    .trim()
    .toUpperCase();

  const isRecognizedAction = rawActionStr && Object.prototype.hasOwnProperty.call(ACTION_THEMES, rawActionStr);
  const actionKey = isRecognizedAction ? (rawActionStr as RecommendationAction) : null;
  const actionTheme = actionKey ? ACTION_THEMES[actionKey] : NEUTRAL_ACTION_THEME;
  const badgeLabel = actionKey ? actionKey : (rawActionStr || 'LISTING');

  const catKey = safeString(listing.category, 'OTHER').trim().toUpperCase() as DeviceCategory;
  const catMeta = CATEGORY_META[catKey] || CATEGORY_META.OTHER;

  const condKey = safeString(listing.condition, 'WORKING_NORMALLY').trim().toUpperCase() as DeviceCondition;
  const condMeta = CONDITION_META[condKey] || CONDITION_META.WORKING_NORMALLY;

  const isDonate = actionKey === 'DONATE' || badgeLabel === 'DONATE';
  const displayTitle = safeString(listing.title, 'Marketplace Item');
  const displayLocation = safeString(listing.location, 'Sri Lanka');

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.compactCard]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.topRow}>
        {/* Action Type Badge with Neutral Fallback */}
        <View style={[styles.badge, { backgroundColor: actionTheme.bgColor }]}>
          <Text style={[styles.badgeText, { color: actionTheme.badgeColor }]}>
            {badgeLabel}
          </Text>
        </View>

        {/* Distance Badge */}
        <Text style={styles.distanceText}>
          {formatDistance(listing.distanceKm)}
        </Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {displayTitle}
      </Text>

      <View style={styles.metaRow}>
        <Text style={styles.categoryTag}>
          {catMeta?.icon || '📦'} {catMeta?.label || safeString(listing.category, 'Item')}
        </Text>
        <Text style={styles.dot}>•</Text>
        <Text style={[styles.conditionTag, { color: condMeta?.color || COLORS.textSecondary }]}>
          {condMeta?.badge || safeString(listing.condition, 'Used')}
        </Text>
      </View>

      <View style={styles.footer}>
        <View>
          {isDonate ? (
            <Text style={styles.freePrice}>FREE (Donation)</Text>
          ) : (
            <Text style={styles.price}>
              ${(typeof listing.price === 'number' && !isNaN(listing.price) ? listing.price : 0).toFixed(2)}
            </Text>
          )}
          <Text style={styles.locationText} numberOfLines={1}>
            📍 {displayLocation}
          </Text>
        </View>

        <Text style={styles.ctaArrow}>→</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    ...SHADOWS.card,
    marginBottom: SPACING.md,
  },
  compactCard: {
    width: 240,
    marginRight: SPACING.md,
    marginBottom: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  distanceText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 18,
    marginBottom: SPACING.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  categoryTag: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  dot: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginHorizontal: 4,
  },
  conditionTag: {
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  freePrice: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.donatePurple,
  },
  locationText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  ctaArrow: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});
