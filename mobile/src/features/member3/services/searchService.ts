// ============================================================================
// Member 3 - Unified Search & Browse Service
// Queries Cloud Firestore collections directly (`items`, `serviceProviders`, `listings`, `recyclingRequests`)
// ============================================================================

import { SearchFilters, UnifiedSearchResults } from '../types';
import {
  fetchFirestoreProviders,
  fetchFirestoreListings,
  fetchFirestoreRecyclingRequests,
  rankProvidersByDistance,
  filterListings,
  filterRecyclingRequests,
  filterItems,
  normalizeProvider,
  normalizeListing,
  normalizeRecyclePoint,
} from './pureSearchAndDiscovery';
import {
  MOCK_PROVIDERS,
  MOCK_LISTINGS,
  MOCK_RECYCLE_POINTS,
} from '../utils/mockData';

export async function searchUnified(
  filters: SearchFilters
): Promise<{ data: UnifiedSearchResults; isOfflineFallback: boolean }> {
  let isOfflineFallback = false;
  let providersRaw: any[] = [];
  let listingsRaw: any[] = [];
  let recycleRaw: any[] = [];

  try {
    const [pRes, lRes, rRes] = await Promise.allSettled([
      fetchFirestoreProviders(),
      fetchFirestoreListings(),
      fetchFirestoreRecyclingRequests(),
    ]);

    providersRaw = pRes.status === 'fulfilled' ? pRes.value : [];
    listingsRaw = lRes.status === 'fulfilled' ? lRes.value : [];
    recycleRaw = rRes.status === 'fulfilled' ? rRes.value : [];
  } catch {
    providersRaw = [];
    listingsRaw = [];
    recycleRaw = [];
  }

  // Gracefully fallback to curated items if Firestore collections are empty or unreachable
  if (providersRaw.length === 0) {
    providersRaw = MOCK_PROVIDERS as any[];
    isOfflineFallback = true;
  }
  if (listingsRaw.length === 0) {
    listingsRaw = MOCK_LISTINGS as any[];
    isOfflineFallback = true;
  }
  if (recycleRaw.length === 0) {
    recycleRaw = MOCK_RECYCLE_POINTS as any[];
    isOfflineFallback = true;
  }

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

  const slicedProviders = filteredProviders
    .slice(startIndex, startIndex + limit)
    .map(normalizeProvider);
  const slicedListings = filteredListings
    .slice(startIndex, startIndex + limit)
    .map(normalizeListing);
  const slicedRecycle = filteredRecycle
    .slice(startIndex, startIndex + limit)
    .map(normalizeRecyclePoint);

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
    isOfflineFallback,
  };
}

export { filterItems, filterListings, rankProvidersByDistance, filterRecyclingRequests };
