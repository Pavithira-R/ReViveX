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
} from './pureSearchAndDiscovery';

export async function searchUnified(
  filters: SearchFilters
): Promise<{ data: UnifiedSearchResults; isOfflineFallback: boolean }> {
  const [providersRaw, listingsRaw, recycleRaw] = await Promise.all([
    fetchFirestoreProviders(),
    fetchFirestoreListings(),
    fetchFirestoreRecyclingRequests(),
  ]);

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
    isOfflineFallback: false,
  };
}

export { filterItems, filterListings, rankProvidersByDistance, filterRecyclingRequests };
