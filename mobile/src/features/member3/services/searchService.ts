// ============================================================================
// Member 3 - Unified Search & Browse Service
// Calls GET /api/search with query string serialization & mock fallback
// ============================================================================

import { SearchFilters, UnifiedSearchResults } from '../types';
import { requestApi } from './apiClient';
import { MOCK_PROVIDERS, MOCK_LISTINGS, MOCK_RECYCLE_POINTS } from '../utils/mockData';

export async function searchUnified(
  filters: SearchFilters
): Promise<{ data: UnifiedSearchResults; isOfflineFallback: boolean }> {
  try {
    const params = new URLSearchParams();

    if (filters.query?.trim()) params.append('q', filters.query.trim());
    if (filters.category) params.append('category', filters.category);
    if (filters.condition) params.append('condition', filters.condition);
    if (filters.actionType && filters.actionType !== 'ALL') {
      params.append('actionType', filters.actionType);
    }
    if (typeof filters.latitude === 'number' && typeof filters.longitude === 'number') {
      params.append('latitude', filters.latitude.toString());
      params.append('longitude', filters.longitude.toString());
    }
    if (typeof filters.radiusKm === 'number') {
      params.append('radiusKm', filters.radiusKm.toString());
    }
    if (typeof filters.minPrice === 'number') {
      params.append('minPrice', filters.minPrice.toString());
    }
    if (typeof filters.maxPrice === 'number') {
      params.append('maxPrice', filters.maxPrice.toString());
    }
    if (typeof filters.minRating === 'number') {
      params.append('minRating', filters.minRating.toString());
    }
    params.append('page', (filters.page || 1).toString());
    params.append('limit', (filters.limit || 10).toString());

    const queryString = params.toString();
    const endpoint = `/search${queryString ? `?${queryString}` : ''}`;

    const data = await requestApi<any>(endpoint, {
      method: 'GET',
      timeoutMs: 5000,
    });

    const resultsBucket = data.results || {};
    const providersList = data.providers || resultsBucket.providers || [];
    const listingsList = data.listings || resultsBucket.listings || [];
    const recycleList = data.recyclePoints || resultsBucket.recycling || [];

    return {
      data: {
        totalCount: data.totalCount || providersList.length + listingsList.length + recycleList.length,
        page: data.page || filters.page || 1,
        limit: data.limit || filters.limit || 10,
        hasMore:
          typeof data.hasMore === 'boolean'
            ? data.hasMore
            : (data.page || 1) * (data.limit || 10) < (data.totalCount || 0),
        providers: providersList,
        listings: listingsList,
        recyclePoints: recycleList,
        appliedFilters: filters,
      },
      isOfflineFallback: false,
    };
  } catch (err: any) {
    console.warn(
      `[SearchService] Backend search unavailable (${err.message}). Using local mock dataset.`
    );

    // Perform local client-side search over mock data
    const qLower = filters.query?.toLowerCase() || '';

    let providers = [...MOCK_PROVIDERS];
    let listings = [...MOCK_LISTINGS];
    let recyclePoints = [...MOCK_RECYCLE_POINTS];

    if (qLower) {
      providers = providers.filter(
        (p) =>
          p.businessName.toLowerCase().includes(qLower) ||
          p.servicesOffered.some((s) => s.toLowerCase().includes(qLower)) ||
          p.location.toLowerCase().includes(qLower)
      );
      listings = listings.filter(
        (l) =>
          l.title.toLowerCase().includes(qLower) ||
          l.category.toLowerCase().includes(qLower) ||
          l.location.toLowerCase().includes(qLower)
      );
      recyclePoints = recyclePoints.filter(
        (r) =>
          r.name.toLowerCase().includes(qLower) ||
          r.address.toLowerCase().includes(qLower) ||
          r.acceptedCategories.some((c) => c.toLowerCase().includes(qLower))
      );
    }

    if (filters.category) {
      listings = listings.filter((l) => l.category === filters.category);
      recyclePoints = recyclePoints.filter((r) =>
        r.acceptedCategories.includes(filters.category!)
      );
    }

    if (filters.condition) {
      listings = listings.filter((l) => l.condition === filters.condition);
    }

    if (filters.actionType && filters.actionType !== 'ALL') {
      listings = listings.filter((l) => l.actionType === filters.actionType);
      if (filters.actionType !== 'REPAIR') {
        providers = [];
      }
      if (filters.actionType !== 'RECYCLE') {
        recyclePoints = [];
      }
    }

    if (typeof filters.minRating === 'number') {
      providers = providers.filter((p) => p.rating >= filters.minRating!);
    }

    if (typeof filters.minPrice === 'number') {
      listings = listings.filter((l) => (l.price ?? 0) >= filters.minPrice!);
      providers = providers.filter((p) => (p.startingPrice ?? 0) >= filters.minPrice!);
    }

    if (typeof filters.maxPrice === 'number') {
      listings = listings.filter((l) => (l.price ?? 0) <= filters.maxPrice!);
      providers = providers.filter((p) => (p.startingPrice ?? 0) <= filters.maxPrice!);
    }

    if (
      typeof filters.latitude === 'number' &&
      typeof filters.longitude === 'number' &&
      typeof filters.radiusKm === 'number'
    ) {
      providers = providers.filter(
        (p) => p.distanceKm === null || p.distanceKm === undefined || p.distanceKm <= filters.radiusKm!
      );
      listings = listings.filter(
        (l) => l.distanceKm === null || l.distanceKm === undefined || l.distanceKm <= filters.radiusKm!
      );
      recyclePoints = recyclePoints.filter(
        (r) => r.distanceKm === null || r.distanceKm === undefined || r.distanceKm <= filters.radiusKm!
      );
    }

    const totalCount = providers.length + listings.length + recyclePoints.length;
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const startIndex = (page - 1) * limit;

    // Simple slice for mock results
    const slicedProviders = providers.slice(startIndex, startIndex + limit);
    const slicedListings = listings.slice(startIndex, startIndex + limit);
    const slicedRecycle = recyclePoints.slice(startIndex, startIndex + limit);

    return {
      data: {
        totalCount,
        page,
        limit,
        hasMore: startIndex + limit < totalCount,
        providers: slicedProviders,
        listings: slicedListings,
        recyclePoints: slicedRecycle,
        appliedFilters: filters,
      },
      isOfflineFallback: true,
    };
  }
}
