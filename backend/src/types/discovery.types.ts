// ============================================================================
// Member 3 - Discovery Feed Types & Contracts
// Specifications for GET /api/discovery/feed
// ============================================================================

import { NormalizedProvider, NormalizedListing, NormalizedRecyclingRequest, NormalizedItem } from '../adapters/types';

/**
 * Entry point banner guiding users to the Member 3 Recommendation Wizard
 */
export interface RecommendationPrompt {
  id: string;
  title: string;
  subtitle: string;
  ctaAction: string;
  targetEndpoint: string;
}

/**
 * Health status indicators for upstream adapter sources
 */
export interface DiscoverySourceStatus {
  providers: 'OK' | 'UNAVAILABLE';
  listings: 'OK' | 'UNAVAILABLE';
  recycling: 'OK' | 'UNAVAILABLE';
  items: 'OK' | 'UNAVAILABLE';
}

/**
 * Raw query parameters accepted by GET /api/discovery/feed
 */
export interface DiscoveryQueryParams {
  sectionLimit?: string | number;
}

/**
 * Validated and normalized discovery query parameters
 */
export interface ValidatedDiscoveryQuery {
  sectionLimit: number;
}

/**
 * Result structure returned by discovery validator
 */
export interface DiscoveryValidationResult {
  isValid: boolean;
  errors: string[];
  validatedQuery?: ValidatedDiscoveryQuery;
}

/**
 * Core response payload for GET /api/discovery/feed
 */
export interface DiscoveryFeedResponseData {
  recommendationPrompt: RecommendationPrompt;
  nearbyProviders: NormalizedProvider[];
  featuredListings: NormalizedListing[];
  urgentDonations: NormalizedListing[];
  eWasteRequests: NormalizedRecyclingRequest[];
  communityItems: NormalizedItem[];
  sourceStatus: DiscoverySourceStatus;
}

/**
 * Standard ReViveX API response envelope for discovery feed
 */
export interface DiscoveryFeedResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: DiscoveryFeedResponseData;
}
