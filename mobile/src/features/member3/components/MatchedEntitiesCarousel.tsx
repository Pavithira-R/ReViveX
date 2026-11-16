// ============================================================================
// Member 3 - MatchedEntitiesCarousel Component
// Displays horizontal carousel of recommended providers, listings, or drop-offs
// ============================================================================

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { RecommendationResult, ServiceProviderSummary, ListingSummary, RecyclePointSummary } from '../types';
import { ProviderCard } from './ProviderCard';
import { ListingCard } from './ListingCard';
import { RecyclePointCard } from './RecyclePointCard';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

interface MatchedEntitiesCarouselProps {
  result: RecommendationResult;
  onSelectProvider?: (provider: ServiceProviderSummary) => void;
  onSelectListing?: (listing: ListingSummary) => void;
  onSelectRecyclePoint?: (point: RecyclePointSummary) => void;
}

export const MatchedEntitiesCarousel: React.FC<MatchedEntitiesCarouselProps> = ({
  result,
  onSelectProvider,
  onSelectListing,
  onSelectRecyclePoint,
}) => {
  const { primaryAction, matchedProviders, matchedListings, matchedRecyclePoints } = result;

  const hasProviders = matchedProviders && matchedProviders.length > 0;
  const hasListings = matchedListings && matchedListings.length > 0;
  const hasRecyclePoints = matchedRecyclePoints && matchedRecyclePoints.length > 0;

  let sectionTitle = 'Recommended Nearby Partners';
  let sectionSubtitle = 'Verified options ready to fulfill your circular action';

  if (primaryAction === 'REPAIR') {
    sectionTitle = 'Top-Rated Repair Technicians';
    sectionSubtitle = 'Specialized in your device category and sorted by proximity';
  } else if (primaryAction === 'SELL' || primaryAction === 'REUSE') {
    sectionTitle = 'Similar Marketplace Listings';
    sectionSubtitle = 'Recent comparable models currently listed in your region';
  } else if (primaryAction === 'DONATE') {
    sectionTitle = 'Active Community Donation Drives';
    sectionSubtitle = 'Verified organizations currently requesting this equipment';
  } else if (primaryAction === 'RECYCLE') {
    sectionTitle = 'Verified E-Waste Drop-Off Depots';
    sectionSubtitle = 'Certified safe disposal points with zero-landfill guarantee';
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{sectionTitle}</Text>
      <Text style={styles.subtitle}>{sectionSubtitle}</Text>

      {/* Render Providers */}
      {primaryAction === 'REPAIR' && (
        hasProviders ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {matchedProviders.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                compact
                onPress={() => onSelectProvider?.(provider)}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No verified repairers currently listed in this specific category. Use Search to broaden criteria.
            </Text>
          </View>
        )
      )}

      {/* Render Listings */}
      {(primaryAction === 'SELL' || primaryAction === 'REUSE' || primaryAction === 'DONATE') && (
        hasListings ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {matchedListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                compact
                onPress={() => onSelectListing?.(listing)}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No comparable marketplace listings found right now. Be the first to list!
            </Text>
          </View>
        )
      )}

      {/* Render Recycle Points */}
      {primaryAction === 'RECYCLE' && (
        hasRecyclePoints ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {matchedRecyclePoints.map((point) => (
              <RecyclePointCard
                key={point.id}
                point={point}
                compact
                onPress={() => onSelectRecyclePoint?.(point)}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Locating nearest municipal bins... Ensure GPS permissions are enabled.
            </Text>
          </View>
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  scrollContent: {
    paddingRight: SPACING.lg,
  },
  emptyCard: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
