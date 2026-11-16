// ============================================================================
// Member 3 - Smart Recommendation & Discovery Type Definitions
// Mobile Frontend Data Contracts (Aligned with backend & cross-member specs)
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

export type DeviceAgeGroup =
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

export type RecommendationAction = 'REPAIR' | 'REUSE' | 'SELL' | 'DONATE' | 'RECYCLE';

export type ActionTypeFilter = 'ALL' | 'REPAIR' | 'SELL' | 'DONATE' | 'REUSE' | 'RECYCLE';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Payload sent to POST /api/recommendations/evaluate
 */
export interface RecommendationInput {
  category: DeviceCategory;
  condition: DeviceCondition;
  ageGroup: DeviceAgeGroup;
  userIntention: UserIntention;
  urgency?: ResolutionUrgency;
  userCoordinates?: LocationCoordinates;
}

/**
 * Service Provider data (Member 4 integration shape)
 */
export interface ServiceProviderSummary {
  id: string;
  businessName: string;
  profileImage?: string;
  isVerified: boolean;
  servicesOffered: string[];
  rating: number;
  reviewCount: number;
  distanceKm?: number | null;
  startingPrice?: number;
  location: string;
  phone?: string;
  availableSlotsCount?: number;
}

/**
 * Item / Marketplace / Donation Listing data (Member 5 integration shape)
 */
export interface ListingSummary {
  id: string;
  title: string;
  actionType: 'SELL' | 'DONATE' | 'REUSE';
  category: DeviceCategory;
  condition: DeviceCondition;
  price?: number | null;
  imageUrl?: string;
  distanceKm?: number | null;
  location: string;
  sellerName?: string;
  createdAt: string;
}

/**
 * E-Waste / Recycling Drop-off Point (Member 5 integration shape)
 */
export interface RecyclePointSummary {
  id: string;
  name: string;
  address: string;
  distanceKm?: number | null;
  acceptedCategories: DeviceCategory[];
  openingHours?: string;
  contactNumber?: string;
  isCertified: boolean;
}

/**
 * Community Urgent Donation Drive (Member 5 integration shape)
 */
export interface UrgentDonationSummary {
  id: string;
  title: string;
  beneficiary: string;
  targetCategory: DeviceCategory;
  quantityNeeded: number;
  urgencyLevel: 'HIGH' | 'CRITICAL';
  location: string;
  distanceKm?: number | null;
  description: string;
}

/**
 * Recommendation Response returned by /api/recommendations/evaluate
 */
export interface RecommendationResult {
  evaluationId: string;
  primaryAction: RecommendationAction;
  secondaryAction?: RecommendationAction | null;
  ruleTriggered: string;
  title: string;
  rationale: string[];
  estimatedCo2SavingsKg: number;
  estimatedEcoPoints: number;
  nextActionLabel: string;
  matchedProviders: ServiceProviderSummary[];
  matchedListings: ListingSummary[];
  matchedRecyclePoints: RecyclePointSummary[];
  timestamp: string;
}

/**
 * Search and Browse Filter Parameters
 */
export interface SearchFilters {
  query?: string;
  category?: DeviceCategory;
  condition?: DeviceCondition;
  actionType?: ActionTypeFilter;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: 'RELEVANCE' | 'DISTANCE' | 'RATING' | 'PRICE_LOW_HIGH' | 'PRICE_HIGH_LOW';
  page: number;
  limit: number;
}

/**
 * Response returned by GET /api/search
 */
export interface UnifiedSearchResults {
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
  providers: ServiceProviderSummary[];
  listings: ListingSummary[];
  recyclePoints: RecyclePointSummary[];
  appliedFilters: SearchFilters;
}

export interface HeroBannerData {
  id: string;
  title: string;
  subtitle: string;
  ctaAction: 'NAVIGATE_QUESTIONNAIRE';
  badgeText: string;
}

/**
 * Discovery Feed Response returned by GET /api/discovery/feed
 */
export interface DiscoveryFeedData {
  heroBanner: HeroBannerData;
  nearbyProviders: ServiceProviderSummary[];
  featuredListings: ListingSummary[];
  urgentDonations: UrgentDonationSummary[];
  nearestRecyclePoint?: RecyclePointSummary | null;
  communityItems?: any[];
  sourceStatus: {
    providers: 'OK' | 'UNAVAILABLE';
    listings: 'OK' | 'UNAVAILABLE';
    recycling: 'OK' | 'UNAVAILABLE';
    items?: 'OK' | 'UNAVAILABLE';
  };
}

/**
 * Location origin source in the 3-tier fallback hierarchy
 */
export type LocationSource = 'GPS' | 'PROFILE' | 'MANUAL';

/**
 * Android runtime location permission status
 */
export type LocationPermissionStatus = 'GRANTED' | 'DENIED' | 'UNAVAILABLE' | 'PROMPT';

/**
 * Unified user location state consumed across Member 3 screens
 */
export interface UserLocationState {
  coordinates: LocationCoordinates;
  source: LocationSource;
  cityName: string;
  district?: string;
  permissionStatus: LocationPermissionStatus;
  isLiveGps: boolean;
  error?: string | null;
}

/**
 * Preset city/district definition for manual location selection
 */
export interface CityPreset {
  id: string;
  name: string;
  district: string;
  province: string;
  coordinates: LocationCoordinates;
}

/**
 * Member 3 Navigation Screen Routes
 */
export type Member3Route =
  | 'DISCOVERY_HOME'
  | 'QUESTIONNAIRE'
  | 'RECOMMENDATION_RESULT'
  | 'SEARCH'
  | 'SEARCH_RESULTS';
