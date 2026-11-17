// ============================================================================
// Member 3 - ProviderCard Component
// Service Provider card (Member 4 Integration)
// ============================================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ServiceProviderSummary } from '../types';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { formatDistance } from '../utils/location';

interface ProviderCardProps {
  provider: ServiceProviderSummary;
  onPress?: () => void;
  compact?: boolean;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  onPress,
  compact = false,
}) => {
  const businessName = provider?.businessName || (provider as any)?.name || 'Certified Repair Center';
  const ratingVal = typeof provider?.rating === 'number'
    ? provider.rating
    : (typeof (provider as any)?.ratingAverage === 'number' ? (provider as any).ratingAverage : 4.8);
  const reviewCountVal = typeof provider?.reviewCount === 'number'
    ? provider.reviewCount
    : (typeof (provider as any)?.ratingCount === 'number' ? (provider as any).ratingCount : 12);
  const servicesList: string[] = Array.isArray(provider?.servicesOffered) && provider.servicesOffered.length > 0
    ? provider.servicesOffered
    : (Array.isArray((provider as any)?.services) && (provider as any).services.length > 0
        ? (provider as any).services
        : ['Diagnostics', 'Screen Replacement', 'Battery Swaps', 'Component Repair']);
  const startingPriceVal = typeof provider?.startingPrice === 'number'
    ? provider.startingPrice
    : 2500;
  const avatarLetter = (businessName.trim().charAt(0) || 'P').toUpperCase();

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.compactCard]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {avatarLetter}
          </Text>
        </View>

        <View style={styles.headerInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.businessName} numberOfLines={1}>
              {businessName}
            </Text>
            {provider?.isVerified && (
              <Text style={styles.verifiedBadge} accessibilityLabel="Verified Provider">
                ✓
              </Text>
            )}
          </View>

          <View style={styles.ratingRow}>
            <Text style={styles.star}>★</Text>
            <Text style={styles.ratingText}>{ratingVal.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({reviewCountVal})</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.distance}>{formatDistance(provider?.distanceKm)}</Text>
          </View>
        </View>
      </View>

      {!compact && (
        <View style={styles.servicesContainer}>
          {servicesList.slice(0, 2).map((srv, idx) => (
            <View key={idx} style={styles.serviceChip}>
              <Text style={styles.serviceText} numberOfLines={1}>
                {srv}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.priceHint}>
          From{' '}
          <Text style={styles.priceValue}>
            Rs. {Math.round(startingPriceVal).toLocaleString('en-US')}
          </Text>
        </Text>
        <Text style={styles.actionPrompt}>View & Book →</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.repairLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.repairTeal,
  },
  headerInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  verifiedBadge: {
    backgroundColor: COLORS.primaryLight,
    color: COLORS.primaryDark,
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADIUS.xs,
    marginLeft: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  star: {
    color: COLORS.starAmber,
    fontSize: 13,
    marginRight: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginRight: 2,
  },
  reviewCount: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginRight: 4,
  },
  dot: {
    color: COLORS.textMuted,
    marginRight: 4,
    fontSize: 10,
  },
  distance: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: SPACING.xs,
  },
  serviceChip: {
    backgroundColor: COLORS.chipBg,
    borderRadius: RADIUS.xs,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  serviceText: {
    fontSize: 11,
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
  priceHint: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  actionPrompt: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
