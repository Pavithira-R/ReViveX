import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { ServiceProvider } from '../types';
import { Colors, Spacing, BorderRadius, Typography } from '../../../theme';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';

interface ProviderCardProps {
  provider: ServiceProvider;
  onPress: (provider: ServiceProvider) => void;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({ provider, onPress }) => {
  const services = provider.servicesOffered || provider.services || [];
  const ratingVal = (provider.ratingAverage ?? provider.rating ?? 5.0).toFixed(1);
  const reviewsVal = provider.ratingCount ?? provider.reviewCount ?? 0;

  return (
    <Card style={styles.card} onPress={() => onPress(provider)}>
      <View style={styles.headerRow}>
        <View style={styles.avatarContainer}>
          {provider.profileImage ? (
            <Image source={{ uri: provider.profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>
                {(provider.businessName || 'SP').substring(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.businessName} numberOfLines={1}>
              {provider.businessName}
            </Text>
            {provider.isVerified && (
              <Badge label="Verified" variant="success" size="sm" style={styles.verifiedBadge} />
            )}
          </View>

          <Text style={styles.providerName}>Tech: {provider.name || provider.businessName}</Text>

          <View style={styles.ratingRow}>
            <Text style={styles.ratingStar}>★</Text>
            <Text style={styles.ratingScore}>{ratingVal}</Text>
            <Text style={styles.reviewCount}>({reviewsVal} reviews)</Text>
            {provider.distanceKm !== undefined && (
              <Text style={styles.distance}>• {provider.distanceKm} km away</Text>
            )}
          </View>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {provider.description}
      </Text>

      <View style={styles.servicesRow}>
        {services.slice(0, 3).map((service, index) => (
          <View key={index} style={styles.serviceChip}>
            <Text style={styles.serviceChipText}>{service}</Text>
          </View>
        ))}
        {services.length > 3 && (
          <Text style={styles.moreServicesText}>
            +{services.length - 3} more
          </Text>
        )}
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.pricing}>
          Starting at <Text style={styles.priceHighlight}>${provider.startingPrice || 25}</Text>
        </Text>
        <Text style={styles.viewProfileText}>View Profile →</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  avatarContainer: {
    marginRight: Spacing.md,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceSubtle,
  },
  avatarFallback: {
    width: 54,
    height: 54,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.primaryDark,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  businessName: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  verifiedBadge: {
    marginLeft: Spacing.xs,
  },
  providerName: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  ratingStar: {
    color: Colors.accent,
    fontSize: Typography.fontSizes.sm,
    marginRight: 2,
  },
  ratingScore: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
    marginRight: 4,
  },
  reviewCount: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginRight: Spacing.xs,
  },
  distance: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.primary,
    fontWeight: Typography.fontWeights.medium,
  },
  description: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  servicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  serviceChip: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.sm,
    paddingVertical: 2,
    paddingHorizontal: Spacing.xs + 2,
  },
  serviceChipText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  moreServicesText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  pricing: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
  },
  priceHighlight: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.primaryDark,
  },
  viewProfileText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.primary,
  },
});
