// ============================================================================
// Member 3 - Recommendation Types & Domain Models
// ============================================================================

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
  // Aliases for compatibility
  ageGroup?: string;
  userIntention?: string;
}

/**
 * Normalized input with validated domain enums
 */
export interface NormalizedRecommendationInput {
  category: DeviceCategory;
  condition: DeviceCondition;
  age: DeviceAge;
  intention: UserIntention;
  urgency: ResolutionUrgency;
}

/**
 * Evaluated recommendation response structure
 */
export interface RecommendationResult {
  recommendation: RecommendationOutcome;
  rationale: string[];
  alternativeAction: RecommendationOutcome | null;
  ruleTriggered: string;
  details: {
    category: DeviceCategory;
    condition: DeviceCondition;
    age: DeviceAge;
    intention: UserIntention;
    urgency: ResolutionUrgency;
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
