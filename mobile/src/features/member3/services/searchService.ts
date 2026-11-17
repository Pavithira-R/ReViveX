// ============================================================================
// Member 3 - Unified Search & Browse Service
// Queries Cloud Firestore collections directly (`items`, `serviceProviders`, `listings`, `recyclingRequests`)
// ============================================================================

import { SearchFilters, UnifiedSearchResults } from '../types';
import {
  fetchFirestoreItems,
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

export async function searchUnified(
  filters: SearchFilters
): Promise<{ data: UnifiedSearchResults; isOfflineFallback: boolean }> {
  let itemsRaw: any[] = [];
  let providersRaw: any[] = [];
  let listingsRaw: any[] = [];
  let recycleRaw: any[] = [];

  try {
    const [iRes, pRes, lRes, rRes] = await Promise.allSettled([
      fetchFirestoreItems(),
      fetchFirestoreProviders(),
      fetchFirestoreListings(),
      fetchFirestoreRecyclingRequests(),
    ]);

    itemsRaw = iRes.status === 'fulfilled' ? iRes.value : [];
    providersRaw = pRes.status === 'fulfilled' ? pRes.value : [];
    listingsRaw = lRes.status === 'fulfilled' ? lRes.value : [];
    recycleRaw = rRes.status === 'fulfilled' ? rRes.value : [];
  } catch {
    itemsRaw = [];
    providersRaw = [];
    listingsRaw = [];
    recycleRaw = [];
  }

  let filteredItems = filterItems(itemsRaw, filters);
  let filteredProviders = rankProvidersByDistance(providersRaw, null, filters);
  let filteredListings = filterListings(listingsRaw, filters);
  let filteredRecycle = filterRecyclingRequests(recycleRaw, filters);

  if (filters.actionType && filters.actionType !== 'ALL') {
    if (filters.actionType !== 'REPAIR') filteredProviders = [];
    if (filters.actionType !== 'RECYCLE') filteredRecycle = [];
  }

  const totalCount = filteredItems.length + filteredProviders.length + filteredListings.length + filteredRecycle.length;
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
    isOfflineFallback: false,
  };
}

export { filterItems, filterListings, rankProvidersByDistance, filterRecyclingRequests };
