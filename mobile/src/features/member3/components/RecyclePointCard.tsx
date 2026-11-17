// ============================================================================
// Member 3 - RecyclePointCard Component
// Certified E-Waste Drop-Off Point card (Member 5 Integration)
// ============================================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RecyclePointSummary } from '../types';
import { CATEGORY_META, COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { formatDistance } from '../utils/location';

interface RecyclePointCardProps {
  point: RecyclePointSummary;
  onPress?: () => void;
  compact?: boolean;
}

export const RecyclePointCard: React.FC<RecyclePointCardProps> = ({
  point,
  onPress,
  compact = false,
}) => {
  const name = point?.name || 'Certified E-Waste Drop-Off Depot';
  const addressStr = typeof point?.address === 'object'
    ? (point.address as any)?.city || (point.address as any)?.district || 'Colombo'
    : String(point?.address || 'Colombo');
  const categories = Array.isArray(point?.acceptedCategories) ? point.acceptedCategories : [];

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.compactCard]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>♻️ CERTIFIED E-WASTE</Text>
        </View>
        <Text style={styles.distance}>{formatDistance(point?.distanceKm)}</Text>
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.address} numberOfLines={1}>
        📍 {addressStr}
      </Text>

      {point?.openingHours && (
        <Text style={styles.hours}>🕒 {point.openingHours}</Text>
      )}

      {!compact && categories.length > 0 && (
        <View style={styles.categoriesRow}>
          <Text style={styles.acceptedLabel}>Accepts: </Text>
          {categories.slice(0, 4).map((cat) => (
            <View key={cat} style={styles.catChip}>
              <Text style={styles.catChipText}>
                {CATEGORY_META[cat]?.label || cat}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.safeBadge}>Zero Landfill Guarantee</Text>
        <Text style={styles.ctaPrompt}>Directions & Hours →</Text>
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
    width: 260,
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
    backgroundColor: COLORS.recycleLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.recycleEmerald,
    letterSpacing: 0.5,
  },
  distance: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  address: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  hours: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  categoriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginVertical: SPACING.xs,
  },
  acceptedLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  catChip: {
    backgroundColor: COLORS.chipBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  catChipText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  safeBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  ctaPrompt: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
});
