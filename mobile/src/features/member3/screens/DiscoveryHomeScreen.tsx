// ============================================================================
// Member 3 - DiscoveryHomeScreen Component
// Central exploration hub (Hero Banner, Providers, Listings, Donations, E-Waste)
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {
  DiscoveryFeedData,
  ServiceProviderSummary,
  ListingSummary,
  RecyclePointSummary,
  UrgentDonationSummary,
  LocationCoordinates,
} from '../types';
import { fetchDiscoveryFeed } from '../services/discoveryService';
import { DEFAULT_USER_COORDINATES } from '../utils/location';
import { SearchBarHeader } from '../components/SearchBarHeader';
import { DiscoveryFeedHero } from '../components/DiscoveryFeedHero';
import { SectionHeader } from '../components/SectionHeader';
import { ProviderCard } from '../components/ProviderCard';
import { ListingCard } from '../components/ListingCard';
import { RecyclePointCard } from '../components/RecyclePointCard';
import { UrgentDonationCard } from '../components/UrgentDonationCard';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

interface DiscoveryHomeScreenProps {
  onStartQuestionnaire: () => void;
  onNavigateToSearch: (initialQuery?: string) => void;
  onSelectProvider?: (provider: ServiceProviderSummary) => void;
  onSelectListing?: (listing: ListingSummary) => void;
  onSelectRecyclePoint?: (point: RecyclePointSummary) => void;
  onSelectDonation?: (donation: UrgentDonationSummary) => void;
  onSeeAllProviders?: () => void;
  onSeeAllListings?: () => void;
}

export const DiscoveryHomeScreen: React.FC<DiscoveryHomeScreenProps> = ({
  onStartQuestionnaire,
  onNavigateToSearch,
  onSelectProvider,
  onSelectListing,
  onSelectRecyclePoint,
  onSelectDonation,
  onSeeAllProviders,
  onSeeAllListings,
}) => {
  const [feed, setFeed] = useState<DiscoveryFeedData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [userCoords, setUserCoords] = useState<LocationCoordinates>(DEFAULT_USER_COORDINATES);

  const loadFeed = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetchDiscoveryFeed(userCoords);
      setFeed(response.feed);
      setIsOffline(response.isOfflineFallback);
    } catch (err) {
      console.error('Failed to load discovery feed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userCoords]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  return (
    <View style={styles.screen}>
      {/* App Header & Location Pill */}
      <View style={styles.topHeader}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>ReViveX</Text>
          <Text style={styles.brandBadge}>DISCOVERY</Text>
        </View>

        <TouchableOpacity style={styles.locationPill} activeOpacity={0.7}>
          <Text style={styles.locationPin}>📍</Text>
          <Text style={styles.locationText}>Colombo Central</Text>
        </TouchableOpacity>
      </View>

      {/* Search Header Bar (Read-only trigger) */}
      <SearchBarHeader
        value=""
        placeholder="Search devices, repairers, recycle bins..."
        isReadOnly
        onPressSearchBar={() => onNavigateToSearch()}
      />

      {/* Offline Status Notice */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            ⚡ Offline Preview Mode: Displaying curated circular-economy sample data
          </Text>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Curating your local discovery feed...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadFeed(true)}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          {/* Hero Banner: 60s Recommendation Questionnaire */}
          {feed?.heroBanner && (
            <DiscoveryFeedHero
              banner={feed.heroBanner}
              onPressStart={onStartQuestionnaire}
            />
          )}

          {/* Section 1: Nearby Repair Providers */}
          {feed?.nearbyProviders && feed.nearbyProviders.length > 0 && (
            <View style={styles.sectionWrapper}>
              <SectionHeader
                title="🛠️ Nearby Repair Specialists"
                subtitle="Top-rated technicians sorted by proximity"
                onPressSeeAll={onSeeAllProviders || (() => onNavigateToSearch('repair'))}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {feed.nearbyProviders.map((prov) => (
                  <ProviderCard
                    key={prov.id}
                    provider={prov}
                    compact
                    onPress={() => onSelectProvider?.(prov)}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Section 2: Featured Marketplace Listings */}
          {feed?.featuredListings && feed.featuredListings.length > 0 && (
            <View style={styles.sectionWrapper}>
              <SectionHeader
                title="🏷️ Available Marketplace Listings"
                subtitle="Second-hand gadgets ready for reuse & purchase"
                onPressSeeAll={onSeeAllListings || (() => onNavigateToSearch())}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {feed.featuredListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    compact
                    onPress={() => onSelectListing?.(listing)}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Section 3: Urgent Donation Opportunities */}
          {feed?.urgentDonations && feed.urgentDonations.length > 0 && (
            <View style={styles.sectionWrapper}>
              <SectionHeader
                title="🎁 Urgent Community Donation Drives"
                subtitle="Verified schools & non-profits requesting equipment"
              />
              <View style={styles.verticalContainer}>
                {feed.urgentDonations.map((donation) => (
                  <UrgentDonationCard
                    key={donation.id}
                    donation={donation}
                    onPress={() => onSelectDonation?.(donation)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Section 4: Nearest Certified E-Waste Drop-Off */}
          {feed?.nearestRecyclePoint && (
            <View style={styles.sectionWrapper}>
              <SectionHeader
                title="♻️ Nearest Certified E-Waste Drop-Off"
                subtitle="Safe electronic recycling and zero-landfill disposal"
              />
              <View style={styles.verticalContainer}>
                <RecyclePointCard
                  point={feed.nearestRecyclePoint}
                  onPress={() => onSelectRecyclePoint?.(feed.nearestRecyclePoint!)}
                />
              </View>
            </View>
          )}

          {/* Bottom Spacing */}
          <View style={styles.bottomPad} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
    backgroundColor: COLORS.surface,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primaryDark,
    letterSpacing: -0.5,
  },
  brandBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    marginLeft: 6,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locationPin: {
    fontSize: 12,
    marginRight: 4,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  offlineBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  offlineText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
    textAlign: 'center',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl,
  },
  sectionWrapper: {
    marginBottom: SPACING.lg,
  },
  horizontalScroll: {
    paddingHorizontal: SPACING.lg,
  },
  verticalContainer: {
    paddingHorizontal: SPACING.lg,
  },
  bottomPad: {
    height: 40,
  },
});
