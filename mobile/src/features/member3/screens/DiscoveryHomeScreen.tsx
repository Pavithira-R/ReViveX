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
  UserLocationState,
  DeviceCondition,
} from '../types';
import { DeviceHealthReport } from '../types/healthCheck.types';
import { fetchDiscoveryFeed } from '../services/discoveryService';
import {
  getLocationState,
  subscribeToLocation,
  resolveUserLocation,
} from '../services/locationService';
import { SearchBarHeader } from '../components/SearchBarHeader';
import { LocationStatusBadge } from '../components/LocationStatusBadge';
import { LocationSelectorModal } from '../components/LocationSelectorModal';
import { DeviceHealthCheckModal } from '../components/DeviceHealthCheckModal';
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
  profileCoordinates?: LocationCoordinates | null;
  profileCity?: string | null;
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
  profileCoordinates,
  profileCity,
}) => {
  const [feed, setFeed] = useState<DiscoveryFeedData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<UserLocationState>(getLocationState());
  const [locationModalVisible, setLocationModalVisible] = useState<boolean>(false);
  const [healthModalVisible, setHealthModalVisible] = useState<boolean>(false);
  const [latestHealthReport, setLatestHealthReport] = useState<DeviceHealthReport | null>(null);

  const handleApplyDiagnosedCondition = (
    _condition: DeviceCondition,
    report: DeviceHealthReport
  ) => {
    setLatestHealthReport(report);
    setHealthModalVisible(false);
    onStartQuestionnaire();
  };

  useEffect(() => {
    // Subscribe to location updates
    const unsubscribe = subscribeToLocation((newState) => {
      setUserLocation(newState);
    });
    return () => unsubscribe();
  }, []);

  const loadFeed = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetchDiscoveryFeed(userLocation.coordinates);
      setFeed(response.feed);
      setIsOffline(response.isOfflineFallback);
    } catch (err) {
      console.error('Failed to load discovery feed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userLocation.coordinates]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleRefresh = async () => {
    // On pull-to-refresh, attempt lazy GPS update if user was in prompt state
    if (userLocation.permissionStatus === 'PROMPT') {
      await resolveUserLocation({
        coordinates: profileCoordinates,
        cityName: profileCity,
      });
    }
    loadFeed(true);
  };

  return (
    <View style={styles.screen}>
      {/* App Header */}
      <View style={styles.topHeader}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>ReViveX</Text>
          <Text style={styles.brandBadge}>DISCOVERY</Text>
        </View>
      </View>

      {/* Location Status Badge & Selector Trigger */}
      <LocationStatusBadge
        location={userLocation}
        onPressChange={() => setLocationModalVisible(true)}
      />

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

          {/* Quick Hardware Diagnostic Card */}
          <View style={styles.diagnosticCard}>
            <View style={styles.diagnosticCardHeader}>
              <View style={styles.diagnosticCardBadge}>
                <Text style={styles.diagnosticCardBadgeText}>HARDWARE DIAGNOSTICS</Text>
              </View>
              {latestHealthReport && (
                <View style={styles.diagnosticScorePill}>
                  <Text style={styles.diagnosticScorePillText}>
                    Score: {latestHealthReport.overallScore}% ({latestHealthReport.derivedCondition})
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.diagnosticCardTitle}>
              🩺 Check Device Health & Repair Viability
            </Text>
            <Text style={styles.diagnosticCardSubtitle}>
              Self-test screen digitizer, battery retention, camera sensor, and motion gyroscopes before choosing whether to repair, sell, donate, or recycle.
            </Text>
            <TouchableOpacity
              style={styles.diagnosticCardButton}
              onPress={() => setHealthModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.diagnosticCardButtonText}>
                {latestHealthReport ? 'Run Diagnostic Again ↻' : 'Run 30-Sec Health Check →'}
              </Text>
            </TouchableOpacity>
          </View>

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

      {/* Location Selector Modal */}
      <LocationSelectorModal
        visible={locationModalVisible}
        currentLocation={userLocation}
        profileCoordinates={profileCoordinates}
        profileCity={profileCity}
        onLocationChanged={(newLoc) => setUserLocation(newLoc)}
        onClose={() => setLocationModalVisible(false)}
      />

      {/* Device Health Check Modal */}
      <DeviceHealthCheckModal
        visible={healthModalVisible}
        onApplyCondition={handleApplyDiagnosedCondition}
        onClose={() => setHealthModalVisible(false)}
      />
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
  diagnosticCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: SPACING.md,
  },
  diagnosticCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  diagnosticCardBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  diagnosticCardBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4338CA',
    letterSpacing: 0.5,
  },
  diagnosticScorePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  diagnosticScorePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  diagnosticCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 4,
    marginBottom: 4,
  },
  diagnosticCardSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginBottom: SPACING.md,
  },
  diagnosticCardButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diagnosticCardButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
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
