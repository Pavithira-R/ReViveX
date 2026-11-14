// ============================================================================
// Member 3 - UrgentDonationCard Component
// Community donation appeal card (Member 5 Integration)
// ============================================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { UrgentDonationSummary } from '../types';
import { CATEGORY_META, COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { formatDistance } from '../utils/location';

interface UrgentDonationCardProps {
  donation: UrgentDonationSummary;
  onPress?: () => void;
  compact?: boolean;
}

export const UrgentDonationCard: React.FC<UrgentDonationCardProps> = ({
  donation,
  onPress,
  compact = false,
}) => {
  const isCritical = donation.urgencyLevel === 'CRITICAL';
  const catMeta = CATEGORY_META[donation.targetCategory];

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.compactCard]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.topRow}>
        <View
          style={[
            styles.urgencyBadge,
            isCritical ? styles.criticalBadge : styles.highBadge,
          ]}
        >
          <Text
            style={[
              styles.urgencyText,
              isCritical ? styles.criticalText : styles.highText,
            ]}
          >
            {isCritical ? '🚨 CRITICAL NEED' : '⚡ HIGH PRIORITY'}
          </Text>
        </View>

        <Text style={styles.distanceText}>
          {formatDistance(donation.distanceKm)}
        </Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {donation.title}
      </Text>

      <Text style={styles.beneficiary}>
        🏫 Beneficiary: <Text style={styles.beneficiaryName}>{donation.beneficiary}</Text>
      </Text>

      <Text style={styles.description} numberOfLines={2}>
        {donation.description}
      </Text>

      <View style={styles.footer}>
        <View style={styles.targetContainer}>
          <Text style={styles.targetCategory}>
            {catMeta?.icon} Need {donation.quantityNeeded} units
          </Text>
        </View>
        <Text style={styles.ctaPrompt}>Support Drive →</Text>
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
    width: 270,
    marginRight: SPACING.md,
    marginBottom: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  criticalBadge: {
    backgroundColor: '#FEE2E2',
  },
  highBadge: {
    backgroundColor: '#FEF3C7',
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  criticalText: {
    color: COLORS.danger,
  },
  highText: {
    color: '#B45309',
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
    marginBottom: 4,
  },
  beneficiary: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  beneficiaryName: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  description: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginBottom: SPACING.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  targetContainer: {
    backgroundColor: COLORS.donateLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  targetCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.donatePurple,
  },
  ctaPrompt: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.donatePurple,
  },
});
