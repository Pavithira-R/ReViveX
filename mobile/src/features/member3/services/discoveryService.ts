// ============================================================================
// Member 3 - Discovery Feed Service
// Uses buildDiscoveryFeed pure function fitted for array feeds (getDocs)
// ============================================================================

import { DiscoveryFeedData, LocationCoordinates } from '../types';
import { requestApi } from './apiClient';
import {
  MOCK_PROVIDERS,
  MOCK_LISTINGS,
  MOCK_RECYCLE_POINTS,
  MOCK_URGENT_DONATIONS,
} from '../utils/mockData';
import { buildDiscoveryFeed } from './pureSearchAndDiscovery';

export async function fetchDiscoveryFeed(
  coords?: LocationCoordinates
): Promise<{ feed: DiscoveryFeedData; isOfflineFallback: boolean }> {
  try {
    const params = new URLSearchParams();
    if (coords) {
      params.append('latitude', coords.latitude.toString());
      params.append('longitude', coords.longitude.toString());
    }

    const queryString = params.toString();
    const endpoint = `/discovery/feed${queryString ? `?${queryString}` : ''}`;

    const data = await requestApi<any>(endpoint, {
      method: 'GET',
      timeoutMs: 5000,
    });

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

    const nearestRecyclePoint =
      data.nearestRecyclePoint ||
      (data.eWasteRequests && data.eWasteRequests.length > 0
        ? {
            id: data.eWasteRequests[0].id,
            name: data.eWasteRequests[0].location || 'Municipal E-Waste Collection Point',
            address: data.eWasteRequests[0].location || 'Central Municipal Depository',
            distanceKm: data.eWasteRequests[0].distanceKm ?? 1.5,
            acceptedCategories: ['LAPTOP', 'PHONE', 'TABLET', 'DESKTOP'],
            isCertified: true,
          }
        : MOCK_RECYCLE_POINTS[0] || null);

    return {
      feed: {
        heroBanner: data.heroBanner || {
          id: 'banner_rec_01',
          title: 'Evaluate Your Old Tech in 60 Seconds',
          subtitle: 'Unsure whether to repair, sell, donate, or recycle? Take the 4-step wizard.',
          ctaAction: 'NAVIGATE_QUESTIONNAIRE' as const,
          badgeText: '60s SMART GUIDE',
        },
        nearbyProviders: data.nearbyProviders || [],
        featuredListings: data.featuredListings || [],
        urgentDonations: mappedDonations.length > 0 ? mappedDonations : MOCK_URGENT_DONATIONS,
        nearestRecyclePoint,
        sourceStatus: data.sourceStatus || {
          providers: 'OK',
          listings: 'OK',
          recycling: 'OK',
        },
      },
      isOfflineFallback: false,
    };
  } catch (err: any) {
    console.warn(
      `[DiscoveryService] Live feed query unavailable (${err?.message || err}). Building feed from pure array aggregator.`
    );

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
}

export { buildDiscoveryFeed };
