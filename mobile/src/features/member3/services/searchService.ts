// ============================================================================
// Member 3 - Unified Search & Browse Service
// Resilient multi-tier architecture: Firestore -> Express REST -> Pure Mock Dataset
// ============================================================================

import { SearchFilters, UnifiedSearchResults } from '../types';
import { requestApi } from './apiClient';
import { MOCK_PROVIDERS, MOCK_LISTINGS, MOCK_RECYCLE_POINTS } from '../utils/mockData';
import {
  fetchFirestoreProviders,
  fetchFirestoreListings,
  fetchFirestoreRecyclingRequests,
  rankProvidersByDistance,
  filterListings,
  filterRecyclingRequests,
  filterItems,
} from './pureSearchAndDiscovery';

export async function searchUnified(
  filters: SearchFilters
): Promise<{ data: UnifiedSearchResults; isOfflineFallback: boolean }> {
  // Tier 1: Primary Firestore direct query
  try {
    const [providersRaw, listingsRaw, recycleRaw] = await Promise.all([
      fetchFirestoreProviders(),
      fetchFirestoreListings(),
      fetchFirestoreRecyclingRequests(),
    ]);

    if (providersRaw.length > 0 || listingsRaw.length > 0 || recycleRaw.length > 0) {
      let filteredProviders = rankProvidersByDistance(providersRaw, null, filters);
      let filteredListings = filterListings(listingsRaw, filters);
      let filteredRecycle = filterRecyclingRequests(recycleRaw, filters);

      if (filters.actionType && filters.actionType !== 'ALL') {
        if (filters.actionType !== 'REPAIR') filteredProviders = [];
        if (filters.actionType !== 'RECYCLE') filteredRecycle = [];
      }

      const totalCount = filteredProviders.length + filteredListings.length + filteredRecycle.length;
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const startIndex = (page - 1) * limit;

      return {
        data: {
          totalCount,
          page,
          limit,
          hasMore: startIndex + limit < totalCount,
          providers: filteredProviders.slice(startIndex, startIndex + limit),
          listings: filteredListings.slice(startIndex, startIndex + limit),
          recyclePoints: filteredRecycle.slice(startIndex, startIndex + limit),
          appliedFilters: filters,
        },
        isOfflineFallback: false,
      };
    }
  } catch (err: any) {
    console.warn('[SearchService] Firestore query skipped or unavailable:', err?.message || err);
  }

  // Tier 2: Express REST API fallback
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
    params.append('page', (filters.page || 1).toString());
    params.append('limit', (filters.limit || 10).toString());

    const data = await requestApi<any>(`/search?${params.toString()}`, { method: 'GET', timeoutMs: 3000 });
    const resultsBucket = data.results || {};
    const providersList = data.providers || resultsBucket.providers || [];
    const listingsList = data.listings || resultsBucket.listings || [];
    const recycleList = data.recyclePoints || resultsBucket.recycling || [];

    return {
      data: {
        totalCount: data.totalCount || providersList.length + listingsList.length + recycleList.length,
        page: data.page || filters.page || 1,
        limit: data.limit || filters.limit || 10,
        hasMore: (data.page || 1) * (data.limit || 10) < (data.totalCount || 0),
        providers: providersList,
        listings: listingsList,
        recyclePoints: recycleList,
        appliedFilters: filters,
      },
      isOfflineFallback: false,
    };
  } catch (err: any) {
    console.warn('[SearchService] Express API query unavailable:', err?.message || err);
  }

  // Tier 3: Pure local dataset fallback
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

  return {
    data: {
      totalCount,
      page,
      limit,
      hasMore: startIndex + limit < totalCount,
      providers: filteredProviders.slice(startIndex, startIndex + limit),
      listings: filteredListings.slice(startIndex, startIndex + limit),
      recyclePoints: filteredRecycle.slice(startIndex, startIndex + limit),
      appliedFilters: filters,
    },
    isOfflineFallback: true,
  };
}

export { filterItems, filterListings, rankProvidersByDistance, filterRecyclingRequests };
