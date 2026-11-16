import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { ServiceProvider } from '../types';
import { Card, StatusBadge } from '../../../../components';
import { COLORS, FONT, RADIUS, SPACING } from '../../../../constants';
import { formatLKR } from '../../../../utils';

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
              <StatusBadge status="VERIFIED" />
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
          Starting at <Text style={styles.priceHighlight}>{formatLKR(provider.startingPrice)}</Text>
        </Text>
        <Text style={styles.viewProfileText}>View Profile →</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  avatarContainer: {
    marginRight: SPACING.md,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSubtle,
  },
  avatarFallback: {
    width: 54,
    height: 54,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: FONT.md,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  businessName: {
    fontSize: FONT.md,
    fontWeight: '700',
    color: COLORS.text,
    flexShrink: 1,
  },
  providerName: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  ratingStar: {
    color: COLORS.accent,
    fontSize: FONT.sm,
    marginRight: 2,
  },
  ratingScore: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: 4,
  },
  reviewCount: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    marginRight: SPACING.xs,
  },
  distance: {
    fontSize: FONT.xs,
    color: COLORS.primary,
    fontWeight: '500',
  },
  description: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  servicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  serviceChip: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.sm,
    paddingVertical: 2,
    paddingHorizontal: SPACING.xs + 2,
  },
  serviceChipText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  moreServicesText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  pricing: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
  },
  priceHighlight: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  viewProfileText: {
    fontSize: FONT.xs,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
