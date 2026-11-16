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
  if (!provider) return null;

  const bName = provider.businessName || (provider as any).name || 'Repair Specialist';
  const avatarLetter = (bName.charAt(0) || 'R').toUpperCase();
  const ratingNum = typeof provider.rating === 'number' && !isNaN(provider.rating) ? provider.rating : 5.0;
  const reviewNum = typeof provider.reviewCount === 'number' && !isNaN(provider.reviewCount) ? provider.reviewCount : 0;
  const startPrice = typeof provider.startingPrice === 'number' && !isNaN(provider.startingPrice) ? provider.startingPrice.toFixed(2) : '20.00';
  const services = Array.isArray(provider.servicesOffered) ? provider.servicesOffered : [];

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
              {bName}
            </Text>
            {provider.isVerified && (
              <Text style={styles.verifiedBadge} accessibilityLabel="Verified Provider">
                ✓
              </Text>
            )}
          </View>

          <View style={styles.ratingRow}>
            <Text style={styles.star}>★</Text>
            <Text style={styles.ratingText}>{ratingNum.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({reviewNum})</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.distance}>{formatDistance(provider.distanceKm)}</Text>
          </View>
        </View>
      </View>

      {!compact && (
        <View style={styles.servicesContainer}>
          {services.slice(0, 2).map((srv, idx) => (
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
            ${startPrice}
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
