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

export const RecyclePointCard: React.FC<RecyclePointCardProps> = ({
  point,
  onPress,
  compact = false,
}) => {
  const displayName = safeString(point?.name, 'Certified E-Waste Recycler');
  const displayAddress = safeString(point?.address, 'Colombo, Sri Lanka');
  const displayHours = point?.openingHours ? safeString(point.openingHours, '') : '';

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
        {displayName}
      </Text>
      <Text style={styles.address} numberOfLines={1}>
        📍 {displayAddress}
      </Text>

      {displayHours ? (
        <Text style={styles.hours}>🕒 {displayHours}</Text>
      ) : null}

      {!compact && point?.acceptedCategories?.length > 0 && (
        <View style={styles.categoriesRow}>
          <Text style={styles.acceptedLabel}>Accepts: </Text>
          {point.acceptedCategories.slice(0, 4).map((cat) => (
            <View key={cat} style={styles.catChip}>
              <Text style={styles.catChipText}>
                {CATEGORY_META[cat]?.label || safeString(cat, 'E-Waste')}
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
