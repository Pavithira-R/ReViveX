// ============================================================================
// Member 3 - Discovery Feed Service
// Curates multi-domain discovery sections across Member 2, 4, and 5 adapters
// ============================================================================

import {
  ProviderAdapter,
  ListingAdapter,
  RecyclingAdapter,
  ItemAdapter,
} from '../adapters';
import {
  NormalizedProvider,
  NormalizedListing,
  NormalizedRecyclingRequest,
  NormalizedItem,
} from '../adapters/types';
import {
  DiscoveryFeedResponseData,
  RecommendationPrompt,
  ValidatedDiscoveryQuery,
} from '../types/discovery.types';

export const RECOMMENDATION_PROMPT: RecommendationPrompt = {
  id: 'banner_rec_01',
  title: 'Evaluate Your Old Tech in 60 Seconds',
  subtitle: 'Unsure whether to repair, sell, donate, or recycle? Take the 4-step wizard.',
  ctaAction: 'NAVIGATE_QUESTIONNAIRE',
  targetEndpoint: '/api/recommendations/evaluate',
};

export class DiscoveryService {
  /**
   * Generates the multi-section Discovery Feed with resilient parallel execution
   */
  async getFeed(query: ValidatedDiscoveryQuery): Promise<DiscoveryFeedResponseData> {
    const { sectionLimit } = query;

    // Parallel execution across all four domain adapters using Promise.allSettled
    const [providersSettled, listingsSettled, recyclingSettled, itemsSettled] =
      await Promise.allSettled([
        ProviderAdapter.queryProviders(),
        ListingAdapter.queryListings(),
        RecyclingAdapter.queryRecyclingRequests(),
        ItemAdapter.queryItems(),
      ]);

    // 1. Nearby / Curated Providers (Member 4)
    let nearbyProviders: NormalizedProvider[] = [];
    let providerStatus: 'OK' | 'UNAVAILABLE' = 'OK';

    if (providersSettled.status === 'fulfilled') {
      const providers = providersSettled.value;
      // Sort: Prioritize known distanceKm (ascending), otherwise rating (desc) & reviewCount (desc)
      nearbyProviders = [...providers]
        .sort((a, b) => {
          const hasDistA = typeof a.distanceKm === 'number' && !isNaN(a.distanceKm);
          const hasDistB = typeof b.distanceKm === 'number' && !isNaN(b.distanceKm);

          if (hasDistA && hasDistB) {
            if (a.distanceKm !== b.distanceKm) {
              return a.distanceKm! - b.distanceKm!;
            }
          } else if (hasDistA && !hasDistB) {
            return -1;
          } else if (!hasDistA && hasDistB) {
            return 1;
          }

          // Fallback / tie-breaker: rating descending, then reviewCount descending
          if (b.rating !== a.rating) {
            return b.rating - a.rating;
          }
          return b.reviewCount - a.reviewCount;
        })
        .slice(0, sectionLimit);
    } else {
      providerStatus = 'UNAVAILABLE';
      console.error(
        'ProviderAdapter discovery query failed:',
        providersSettled.reason?.message || providersSettled.reason
      );
    }

    // 2. Marketplace Listings & 3. Urgent Donations (Member 5)
    let featuredListings: NormalizedListing[] = [];
    let urgentDonations: NormalizedListing[] = [];
    let listingStatus: 'OK' | 'UNAVAILABLE' = 'OK';

    if (listingsSettled.status === 'fulfilled') {
      const allListings = listingsSettled.value;

      // Featured Listings: SELL or REUSE, status === AVAILABLE, sorted by createdAt desc
      featuredListings = allListings
        .filter(
          (l) =>
            (l.actionType === 'SELL' || l.actionType === 'REUSE') &&
            l.status === 'AVAILABLE'
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, sectionLimit);

      // Urgent Donations: DONATE, status === AVAILABLE, sorted by createdAt desc
      urgentDonations = allListings
        .filter((l) => l.actionType === 'DONATE' && l.status === 'AVAILABLE')
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, sectionLimit);
    } else {
      listingStatus = 'UNAVAILABLE';
      console.error(
        'ListingAdapter discovery query failed:',
        listingsSettled.reason?.message || listingsSettled.reason
      );
    }

    // 4. E-Waste & Recycling Requests (Member 5)
    let eWasteRequests: NormalizedRecyclingRequest[] = [];
    let recyclingStatus: 'OK' | 'UNAVAILABLE' = 'OK';

    if (recyclingSettled.status === 'fulfilled') {
      const requests = recyclingSettled.value;

      // Active requests: PENDING or SCHEDULED
      eWasteRequests = requests
        .filter((r) => r.status === 'PENDING' || r.status === 'SCHEDULED')
        .sort((a, b) => {
          const timeA = a.pickupDate ? new Date(a.pickupDate).getTime() : NaN;
          const timeB = b.pickupDate ? new Date(b.pickupDate).getTime() : NaN;
          const hasDateA = !isNaN(timeA);
          const hasDateB = !isNaN(timeB);

          if (hasDateA && hasDateB) {
            if (timeA !== timeB) {
              return timeA - timeB; // Upcoming earliest first
            }
          } else if (hasDateA && !hasDateB) {
            return -1;
          } else if (!hasDateA && hasDateB) {
            return 1;
          }

          // Fallback to createdAt descending
          const createdA = new Date(a.createdAt).getTime() || 0;
          const createdB = new Date(b.createdAt).getTime() || 0;
          return createdB - createdA;
        })
        .slice(0, sectionLimit);
    } else {
      recyclingStatus = 'UNAVAILABLE';
      console.error(
        'RecyclingAdapter discovery query failed:',
        recyclingSettled.reason?.message || recyclingSettled.reason
      );
    }

    // 5. Community Items for Circular Exchange (Member 2)
    let communityItems: NormalizedItem[] = [];
    let itemStatus: 'OK' | 'UNAVAILABLE' = 'OK';

    if (itemsSettled.status === 'fulfilled') {
      const items = itemsSettled.value;

      // Circular actions: REUSE, DONATE, or SELL
      communityItems = items
        .filter(
          (i) =>
            i.action === 'REUSE' || i.action === 'DONATE' || i.action === 'SELL'
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, sectionLimit);
    } else {
      itemStatus = 'UNAVAILABLE';
      console.error(
        'ItemAdapter discovery query failed:',
        itemsSettled.reason?.message || itemsSettled.reason
      );
    }

    return {
      recommendationPrompt: RECOMMENDATION_PROMPT,
      nearbyProviders,
      featuredListings,
      urgentDonations,
      eWasteRequests,
      communityItems,
      sourceStatus: {
        providers: providerStatus,
        listings: listingStatus,
        recycling: recyclingStatus,
        items: itemStatus,
      },
    };
  }
}

export const discoveryService = new DiscoveryService();
