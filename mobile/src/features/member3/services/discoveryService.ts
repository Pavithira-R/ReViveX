// ============================================================================
// Member 3 - Discovery Feed Service
// Resilient multi-tier architecture: Firestore -> Express REST -> Pure Mock Dataset
// ============================================================================

import { DiscoveryFeedData, LocationCoordinates } from '../types';
import { requestApi } from './apiClient';
import {
  MOCK_HERO_BANNER,
  MOCK_PROVIDERS,
  MOCK_LISTINGS,
  MOCK_RECYCLE_POINTS,
  MOCK_URGENT_DONATIONS,
} from '../utils/mockData';
import {
  buildDiscoveryFeed,
  fetchFirestoreDiscoveryFeed,
} from './pureSearchAndDiscovery';

export async function fetchDiscoveryFeed(
  coords?: LocationCoordinates
): Promise<{ feed: DiscoveryFeedData; isOfflineFallback: boolean }> {
  // Tier 1: Primary Firestore direct query
  try {
    const feed = await fetchFirestoreDiscoveryFeed(coords);
    if (
      feed.nearbyProviders.length > 0 ||
      feed.featuredListings.length > 0 ||
      feed.urgentDonations.length > 0
    ) {
      return {
        feed,
        isOfflineFallback: false,
      };
    }
  } catch (err: any) {
    console.warn('[DiscoveryService] Firestore feed skipped or unavailable:', err?.message || err);
  }

  // Tier 2: Express REST API fallback
  try {
    const params = new URLSearchParams();
    if (coords) {
      params.append('latitude', coords.latitude.toString());
      params.append('longitude', coords.longitude.toString());
    }

    const data = await requestApi<any>(`/discovery/feed?${params.toString()}`, { method: 'GET', timeoutMs: 3000 });
    const mappedDonations = (data.urgentDonations || []).map((d: any) => ({
      id: d.id,
      title: d.title,
      beneficiary: d.beneficiary || d.user?.name || 'Community Donation Drive',
      targetCategory: d.targetCategory || d.category || 'LAPTOP',
      quantityNeeded: d.quantityNeeded || 1,
      urgencyLevel: d.urgencyLevel || 'HIGH',
      location: d.location || 'Colombo',
      distanceKm: d.distanceKm ?? null,
      description: d.description || 'Community electronics donation drive.',
    }));

    return {
      feed: {
        heroBanner: data.heroBanner || MOCK_HERO_BANNER,
        nearbyProviders: data.nearbyProviders || [],
        featuredListings: data.featuredListings || [],
        urgentDonations: mappedDonations.length > 0 ? mappedDonations : MOCK_URGENT_DONATIONS,
        nearestRecyclePoint: data.nearestRecyclePoint || MOCK_RECYCLE_POINTS[0] || null,
        sourceStatus: data.sourceStatus || {
          providers: 'OK',
          listings: 'OK',
          recycling: 'OK',
          items: 'OK',
        },
      },
      isOfflineFallback: false,
    };
  } catch (err: any) {
    console.warn('[DiscoveryService] Express API feed unavailable:', err?.message || err);
  }

  // Tier 3: Pure local dataset fallback
  const feed = buildDiscoveryFeed({
    providers: MOCK_PROVIDERS,
    listings: MOCK_LISTINGS,
    recyclingRequests: MOCK_RECYCLE_POINTS,
    userLocation: coords,
    sectionLimit: 4,
  });

  return {
    feed,
    isOfflineFallback: true,
  };
}

export { buildDiscoveryFeed, fetchFirestoreDiscoveryFeed };
