// ============================================================================
// Member 3 - Unified Search & Filtering Domain Types
// ============================================================================

import {
  NormalizedItem,
  NormalizedProvider,
  NormalizedListing,
  NormalizedRecyclingRequest,
} from '../adapters/types';

export type SearchActionType =
  | 'ALL'
  | 'REPAIR'
  | 'SELL'
  | 'DONATE'
  | 'REUSE'
  | 'RECYCLE';

export type SearchEntityType =
  | 'ALL'
  | 'ITEMS'
  | 'PROVIDERS'
  | 'LISTINGS'
  | 'RECYCLING';

export type SearchCondition =
  | 'WORKING'
  | 'DAMAGED'
  | 'BROKEN'
  | 'WORKING_NORMALLY'
  | 'WORKING_WITH_PROBLEMS'
  | 'NOT_WORKING'
  | 'PHYSICALLY_DAMAGED';

/**
 * Raw query parameters received from Express req.query
 */
export interface SearchQueryParams {
  q?: string;
  search?: string;
  category?: string;
  actionType?: string;
  condition?: string;
  entityType?: string;
  minRating?: string | number;
  maxDistanceKm?: string | number;
  minPrice?: string | number;
  maxPrice?: string | number;
  page?: string | number;
  limit?: string | number;
}

/**
 * Clean, parsed, and validated search query parameters
 */
export interface ValidatedSearchQuery {
  q?: string;
  category?: string;
  actionType: SearchActionType;
  condition?: SearchCondition;
  entityType: SearchEntityType;
  minRating?: number;
  maxDistanceKm?: number;
  minPrice?: number;
  maxPrice?: number;
  page: number;
  limit: number;
}

/**
 * Unified multi-bucket search results
 */
export interface UnifiedSearchResults {
  items: NormalizedItem[];
  providers: NormalizedProvider[];
  listings: NormalizedListing[];
  recycling: NormalizedRecyclingRequest[];
}

/**
 * Result counts breakdown per domain
 */
export interface SearchSummary {
  itemsCount: number;
  providersCount: number;
  listingsCount: number;
  recyclingCount: number;
}

/**
 * Status indicator for upstream adapter health
 */
export type AdapterSourceStatus = 'OK' | 'UNAVAILABLE' | 'SKIPPED';

/**
 * Complete payload structure returned inside data
 */
export interface UnifiedSearchResponseData {
  query: string;
  totalResults: number;
  page: number;
  limit: number;
  appliedFilters: {
    category?: string;
    actionType: SearchActionType;
    condition?: SearchCondition;
    entityType: SearchEntityType;
    minRating?: number;
    maxDistanceKm?: number;
    minPrice?: number;
    maxPrice?: number;
  };
  summary: SearchSummary;
  results: UnifiedSearchResults;
  sourceStatus?: {
    items: AdapterSourceStatus;
    providers: AdapterSourceStatus;
    listings: AdapterSourceStatus;
    recycling: AdapterSourceStatus;
  };
}
