// ============================================================================
// Member 3 - Unified Search & Browse Service
// Uses pure array filtering functions fitted for Firestore getDocs array feeds
// ============================================================================

import { SearchFilters, UnifiedSearchResults } from '../types';
import { requestApi } from './apiClient';
import { MOCK_PROVIDERS, MOCK_LISTINGS, MOCK_RECYCLE_POINTS } from '../utils/mockData';
import {
  rankProvidersByDistance,
  filterListings,
  filterRecyclingRequests,
  filterItems,
} from './pureSearchAndDiscovery';

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
      `[SearchService] Live API query unavailable (${err?.message || err}). Processing through pure array filter functions.`
    );

    // Filter candidate arrays using pure functions (prepared for Firestore getDocs input)
    let filteredProviders = rankProvidersByDistance(MOCK_PROVIDERS, null, filters);
    let filteredListings = filterListings(MOCK_LISTINGS, filters);
    let filteredRecycle = filterRecyclingRequests(MOCK_RECYCLE_POINTS, filters);

    if (filters.actionType && filters.actionType !== 'ALL') {
      if (filters.actionType !== 'REPAIR') filteredProviders = [];
      if (filters.actionType !== 'RECYCLE') filteredRecycle = [];
    }

    const totalCount = filteredProviders.length + filteredListings.length + filteredRecycle.length;
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const startIndex = (page - 1) * limit;

    const slicedProviders = filteredProviders.slice(startIndex, startIndex + limit);
    const slicedListings = filteredListings.slice(startIndex, startIndex + limit);
    const slicedRecycle = filteredRecycle.slice(startIndex, startIndex + limit);

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

export { filterItems, filterListings, rankProvidersByDistance, filterRecyclingRequests };
