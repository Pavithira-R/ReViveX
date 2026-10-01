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
      minPrice,
      maxPrice,
      page,
      limit,
    } = query;

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
    // 2. Build adapter query parameter objects with strict filter scoping
    // ------------------------------------------------------------------------
    // Member 2 Items Query
    const itemActionParam = actionType !== 'ALL' ? actionType : undefined;
    const itemConditionParam = mapToMember2Condition(condition);

    const itemPromise = shouldQueryItems
      ? ItemAdapter.queryItems({
          search: q,
          action: itemActionParam,
          condition: itemConditionParam,
          page: entityType === 'ITEMS' ? page : 1,
          limit,
        })
      : null;

    // Member 4 Service Providers Query
    const providerPromise = shouldQueryProviders
      ? ProviderAdapter.queryProviders({
          search: q,
          category,
          minRating,
          maxDistanceKm,
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
          actionType: listingActionParam,
          minPrice,
          maxPrice,
        })
      : null;

    // Member 5 Recycling Requests Query
    const recyclingPromise = shouldQueryRecycling
      ? RecyclingAdapter.queryRecyclingRequests({
          search: q,
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
      // Apply category text filter on items if category was provided
      if (category && items.length > 0) {
        const catLower = category.toLowerCase();
        items = items.filter((i) => i.categoryName.toLowerCase().includes(catLower));
      }
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
      // Apply condition filter on listings if condition was provided
      if (condition && listings.length > 0) {
        const condLower = condition.toLowerCase();
        listings = listings.filter((l) => l.condition.toLowerCase().includes(condLower));
      }
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

    // ------------------------------------------------------------------------
    // 5. Apply pagination limit per active bucket
    // ------------------------------------------------------------------------
    if (entityType === 'ALL') {
      items = items.slice(0, limit);
      providers = providers.slice(0, limit);
      listings = listings.slice(0, limit);
      recycling = recycling.slice(0, limit);
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
        maxDistanceKm,
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
