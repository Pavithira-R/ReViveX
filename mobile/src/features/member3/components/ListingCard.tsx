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
  const actionTheme = ACTION_THEMES[listing.actionType];
  const catMeta = CATEGORY_META[listing.category];
  const condMeta = CONDITION_META[listing.condition];

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
            {listing.actionType}
          </Text>
        </View>

        {/* Distance Badge */}
        <Text style={styles.distanceText}>
          {formatDistance(listing.distanceKm)}
        </Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {listing.title}
      </Text>

      <View style={styles.metaRow}>
        <Text style={styles.categoryTag}>
          {catMeta?.icon} {catMeta?.label || listing.category}
        </Text>
        <Text style={styles.dot}>•</Text>
        <Text style={[styles.conditionTag, { color: condMeta?.color || COLORS.textSecondary }]}>
          {condMeta?.badge || listing.condition}
        </Text>
      </View>

      <View style={styles.footer}>
        <View>
          {listing.actionType === 'DONATE' ? (
            <Text style={styles.freePrice}>FREE (Donation)</Text>
          ) : (
            <Text style={styles.price}>
              ${(listing.price ?? 0).toFixed(2)}
            </Text>
          )}
          <Text style={styles.locationText} numberOfLines={1}>
            📍 {listing.location}
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
