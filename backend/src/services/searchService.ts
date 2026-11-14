// ============================================================================
// Member 3 - Unified Search Service
// Resilient, multi-adapter search engine orchestrating parallel data retrieval
// ============================================================================

import {
  ItemAdapter,
  ProviderAdapter,
  ListingAdapter,
  RecyclingAdapter,
  mapToMember2Condition,
  NormalizedItem,
  NormalizedProvider,
  NormalizedListing,
  NormalizedRecyclingRequest,
} from '../adapters';

import {
  ValidatedSearchQuery,
  UnifiedSearchResponseData,
  AdapterSourceStatus,
} from '../types/search.types';

export class SearchService {
  /**
   * Executes unified search across all domains in parallel using Promise.allSettled()
   * Guarantees that filtering occurs BEFORE pagination and distance calculations are respected.
   */
  async search(query: ValidatedSearchQuery): Promise<UnifiedSearchResponseData> {
    const {
      q,
      category,
      actionType,
      condition,
      entityType,
      minRating,
      maxDistanceKm,
      radiusKm,
      latitude,
      longitude,
      minPrice,
      maxPrice,
      page,
      limit,
    } = query;

    const effectiveRadius = radiusKm ?? maxDistanceKm;

    // ------------------------------------------------------------------------
    // 1. Determine which sources are active based on actionType & entityType
    // ------------------------------------------------------------------------
    const shouldQueryItems =
      (entityType === 'ALL' || entityType === 'ITEMS');

    const shouldQueryProviders =
      (entityType === 'ALL' || entityType === 'PROVIDERS') &&
      (actionType === 'ALL' || actionType === 'REPAIR');

    const shouldQueryListings =
      (entityType === 'ALL' || entityType === 'LISTINGS') &&
      (actionType === 'ALL' || actionType === 'SELL' || actionType === 'DONATE' || actionType === 'REUSE');

    const shouldQueryRecycling =
      (entityType === 'ALL' || entityType === 'RECYCLING') &&
      (actionType === 'ALL' || actionType === 'RECYCLE');

    // ------------------------------------------------------------------------
    // 2. Build adapter query parameters with filtering and pagination
    // ------------------------------------------------------------------------
    // Member 2 Items Query (filtering before pagination)
    const itemActionParam = actionType !== 'ALL' ? actionType : undefined;
    const itemConditionParam = mapToMember2Condition(condition);

    const itemPromise = shouldQueryItems
      ? ItemAdapter.queryItems({
          search: q,
          category,
          action: itemActionParam,
          condition: itemConditionParam,
          latitude,
          longitude,
          radiusKm: effectiveRadius,
          page,
          limit,
        })
      : null;

    // Member 4 Service Providers Query
    const providerPromise = shouldQueryProviders
      ? ProviderAdapter.queryProviders({
          search: q,
          category,
          minRating,
          maxDistanceKm: effectiveRadius,
          radiusKm: effectiveRadius,
          latitude,
          longitude,
          page,
          limit,
        })
      : null;

    // Member 5 Marketplace Listings Query
    let listingActionParam: 'ALL' | 'SELL' | 'DONATE' | 'REUSE' = 'ALL';
    if (actionType === 'SELL') listingActionParam = 'SELL';
    else if (actionType === 'DONATE') listingActionParam = 'DONATE';
    else if (actionType === 'REUSE') listingActionParam = 'REUSE';

    const listingPromise = shouldQueryListings
      ? ListingAdapter.queryListings({
          search: q,
          category,
          condition,
          actionType: listingActionParam,
          minPrice,
          maxPrice,
          latitude,
          longitude,
          radiusKm: effectiveRadius,
          page,
          limit,
        })
      : null;

    // Member 5 Recycling Requests Query
    const recyclingPromise = shouldQueryRecycling
      ? RecyclingAdapter.queryRecyclingRequests({
          search: q,
          latitude,
          longitude,
          radiusKm: effectiveRadius,
          page,
          limit,
        })
      : null;

    // ------------------------------------------------------------------------
    // 3. Parallel Execution via Promise.allSettled() (Resilient to partial failures)
    // ------------------------------------------------------------------------
    const [itemSettled, providerSettled, listingSettled, recyclingSettled] =
      await Promise.allSettled([
        itemPromise || Promise.resolve([]),
        providerPromise || Promise.resolve([]),
        listingPromise || Promise.resolve([]),
        recyclingPromise || Promise.resolve([]),
      ]);

    // ------------------------------------------------------------------------
    // 4. Safe extraction and error resilience handling
    // ------------------------------------------------------------------------
    let items: NormalizedItem[] = [];
    let itemsStatus: AdapterSourceStatus = shouldQueryItems ? 'OK' : 'SKIPPED';
    if (itemSettled.status === 'fulfilled') {
      items = itemSettled.value as NormalizedItem[];
    } else {
      console.warn('ItemAdapter query failed:', itemSettled.reason?.message || itemSettled.reason);
      itemsStatus = 'UNAVAILABLE';
    }

    let providers: NormalizedProvider[] = [];
    let providersStatus: AdapterSourceStatus = shouldQueryProviders ? 'OK' : 'SKIPPED';
    if (providerSettled.status === 'fulfilled') {
      providers = providerSettled.value as NormalizedProvider[];
    } else {
      console.warn('ProviderAdapter query failed:', providerSettled.reason?.message || providerSettled.reason);
      providersStatus = 'UNAVAILABLE';
    }

    let listings: NormalizedListing[] = [];
    let listingsStatus: AdapterSourceStatus = shouldQueryListings ? 'OK' : 'SKIPPED';
    if (listingSettled.status === 'fulfilled') {
      listings = listingSettled.value as NormalizedListing[];
    } else {
      console.warn('ListingAdapter query failed:', listingSettled.reason?.message || listingSettled.reason);
      listingsStatus = 'UNAVAILABLE';
    }

    let recycling: NormalizedRecyclingRequest[] = [];
    let recyclingStatus: AdapterSourceStatus = shouldQueryRecycling ? 'OK' : 'SKIPPED';
    if (recyclingSettled.status === 'fulfilled') {
      recycling = recyclingSettled.value as NormalizedRecyclingRequest[];
    } else {
      console.warn('RecyclingAdapter query failed:', recyclingSettled.reason?.message || recyclingSettled.reason);
      recyclingStatus = 'UNAVAILABLE';
    }

    const totalResults =
      items.length + providers.length + listings.length + recycling.length;

    return {
      query: q || '',
      totalResults,
      page,
      limit,
      appliedFilters: {
        category,
        actionType,
        condition,
        entityType,
        minRating,
        maxDistanceKm: effectiveRadius,
        radiusKm: effectiveRadius,
        latitude,
        longitude,
        minPrice,
        maxPrice,
      },
      summary: {
        itemsCount: items.length,
        providersCount: providers.length,
        listingsCount: listings.length,
        recyclingCount: recycling.length,
      },
      results: {
        items,
        providers,
        listings,
        recycling,
      },
      sourceStatus: {
        items: itemsStatus,
        providers: providersStatus,
        listings: listingsStatus,
        recycling: recyclingStatus,
      },
    };
  }
}

export const searchService = new SearchService();
