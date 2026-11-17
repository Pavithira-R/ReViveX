// ============================================================================
// Member 3 - ListingCard Component
// Marketplace & Donation Listing card (Member 5 Integration)
// ============================================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ListingSummary } from '../types';
import {
  ACTION_THEMES,
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

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onPress,
  compact = false,
}) => {
  const actionKey = (listing?.actionType || 'REUSE').toUpperCase() as keyof typeof ACTION_THEMES;
  const actionTheme = ACTION_THEMES[actionKey] || ACTION_THEMES.REUSE;
  const categoryKey = (listing?.category || 'OTHER').toUpperCase() as keyof typeof CATEGORY_META;
  const catMeta = CATEGORY_META[categoryKey] || CATEGORY_META.OTHER;
  const conditionKey = (listing?.condition || 'WORKING_NORMALLY').toUpperCase() as keyof typeof CONDITION_META;
  const condMeta = CONDITION_META[conditionKey] || CONDITION_META.WORKING_NORMALLY;

  const locationStr = typeof listing?.location === 'object'
    ? (listing.location as any)?.city || (listing.location as any)?.district || 'Colombo'
    : String(listing?.location || 'Colombo');

  const priceVal = typeof listing?.price === 'number' ? listing.price : (Number(listing?.price) || 0);

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.compactCard]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.topRow}>
        {/* Action Type Badge */}
        <View style={[styles.badge, { backgroundColor: actionTheme.bgColor }]}>
          <Text style={[styles.badgeText, { color: actionTheme.badgeColor }]}>
            {listing?.actionType || actionKey}
          </Text>
        </View>

        {/* Distance Badge */}
        <Text style={styles.distanceText}>
          {formatDistance(listing?.distanceKm)}
        </Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {listing?.title || 'Electronic Device'}
      </Text>

      <View style={styles.metaRow}>
        <Text style={styles.categoryTag}>
          {catMeta.icon} {catMeta.label}
        </Text>
        <Text style={styles.dot}>•</Text>
        <Text style={[styles.conditionTag, { color: condMeta.color }]}>
          {condMeta.badge}
        </Text>
      </View>

      <View style={styles.footer}>
        <View>
          {actionKey === 'DONATE' ? (
            <Text style={styles.freePrice}>FREE (Donation)</Text>
          ) : (
            <Text style={styles.price}>
              {priceVal > 500 ? `Rs. ${priceVal.toLocaleString()}` : `$${priceVal.toFixed(2)}`}
            </Text>
          )}
          <Text style={styles.locationText} numberOfLines={1}>
            📍 {locationStr}
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
