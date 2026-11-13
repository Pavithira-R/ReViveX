// ============================================================================
// Member 3 - Recommendation Types & Domain Models
// ============================================================================

import {
  NormalizedProvider,
  NormalizedListing,
  NormalizedRecyclingRequest,
} from '../adapters/types';

export type DeviceCategory =
  | 'LAPTOP'
  | 'PHONE'
  | 'TABLET'
  | 'DESKTOP'
  | 'MONITOR'
  | 'PRINTER'
  | 'OTHER';

export type DeviceCondition =
  | 'WORKING_NORMALLY'
  | 'WORKING_WITH_PROBLEMS'
  | 'NOT_WORKING'
  | 'PHYSICALLY_DAMAGED';

export type DeviceAge =
  | 'LESS_THAN_1_YEAR'
  | 'ONE_TO_THREE_YEARS'
  | 'THREE_TO_FIVE_YEARS'
  | 'MORE_THAN_5_YEARS';

export type UserIntention =
  | 'KEEP_USE'
  | 'REPAIR'
  | 'SELL'
  | 'GIVE_AWAY'
  | 'DISPOSE_RESPONSIBLY';

export type ResolutionUrgency = 'FLEXIBLE' | 'URGENT';

export type RecommendationOutcome =
  | 'REPAIR'
  | 'REUSE'
  | 'SELL'
  | 'DONATE'
  | 'RECYCLE';

/**
 * Raw input payload received from the API request
 */
export interface RecommendationInput {
  category?: string;
  condition?: string;
  age?: string;
  intention?: string;
  urgency?: string;
  // Aliases for specification compatibility
  ageGroup?: string;
  userIntention?: string;
  userCoordinates?: {
    latitude: number;
    longitude: number;
  };
  latitude?: number | string;
  longitude?: number | string;
}

/**
 * Normalized input with validated domain enums and optional coordinates
 */
export interface NormalizedRecommendationInput {
  category: DeviceCategory;
  condition: DeviceCondition;
  age: DeviceAge;
  intention: UserIntention;
  urgency: ResolutionUrgency;
  userCoordinates?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Complete evaluated recommendation response structure aligned with docs/member3-recommendation-discovery.md §11.1
 */
export interface RecommendationResult {
  evaluationId: string;
  primaryAction: RecommendationOutcome;
  secondaryAction: RecommendationOutcome | null;
  // Backward compatibility aliases
  recommendation: RecommendationOutcome;
  alternativeAction: RecommendationOutcome | null;
  ruleTriggered: string;
  title: string;
  rationale: string[];
  estimatedCo2SavingsKg: number | null;
  estimatedEcoPoints: number | null;
  nextActionLabel: string;
  matchedProviders: NormalizedProvider[];
  matchedListings: NormalizedListing[];
  matchedRecyclePoints: NormalizedRecyclingRequest[];
  timestamp: string;
  details: {
    category: DeviceCategory;
    condition: DeviceCondition;
    age: DeviceAge;
    intention: UserIntention;
    urgency: ResolutionUrgency;
    userCoordinates?: {
      latitude: number;
      longitude: number;
    };
  };
}

/**
 * Standard API response envelope
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data?: T;
  message?: string;
  error?: string;
  details?: string[];
}
