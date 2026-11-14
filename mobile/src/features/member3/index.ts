// ============================================================================
// Member 3 - Smart Recommendation & Discovery Feature Module
// Public Barrel Export
// ============================================================================

// Main Navigator
export { Member3Navigator, type Member3NavigatorProps } from './navigation/Member3Navigator';

// Screens
export { DiscoveryHomeScreen } from './screens/DiscoveryHomeScreen';
export { RecommendationQuestionnaireScreen } from './screens/RecommendationQuestionnaireScreen';
export { RecommendationResultScreen } from './screens/RecommendationResultScreen';
export { SearchScreen } from './screens/SearchScreen';
export { SearchResultsScreen } from './screens/SearchResultsScreen';

// Core Components
export { CategoryGrid } from './components/CategoryGrid';
export { ConditionSelector } from './components/ConditionSelector';
export { AgeGroupChips } from './components/AgeGroupChips';
export { IntentionRadioList } from './components/IntentionRadioList';
export { UrgencyToggle } from './components/UrgencyToggle';
export { RecommendationResultCard } from './components/RecommendationResultCard';
export { EcoSavingsBanner } from './components/EcoSavingsBanner';
export { MatchedEntitiesCarousel } from './components/MatchedEntitiesCarousel';
export { DiscoveryFeedHero } from './components/DiscoveryFeedHero';
export { SectionHeader } from './components/SectionHeader';
export { ProviderCard } from './components/ProviderCard';
export { ListingCard } from './components/ListingCard';
export { RecyclePointCard } from './components/RecyclePointCard';
export { UrgentDonationCard } from './components/UrgentDonationCard';
export { SearchBarHeader } from './components/SearchBarHeader';
export { MultiFacetFilterModal } from './components/MultiFacetFilterModal';
export { LocationStatusBadge } from './components/LocationStatusBadge';
export { LocationSelectorModal } from './components/LocationSelectorModal';
export { DeviceHealthCheckModal } from './components/DeviceHealthCheckModal';

// Services
export { evaluateRecommendation } from './services/recommendationService';
export { searchUnified } from './services/searchService';
export { fetchDiscoveryFeed } from './services/discoveryService';
export {
  resolveUserLocation,
  setManualCity,
  getLocationState,
  subscribeToLocation,
  requestAndroidLocationPermission,
} from './services/locationService';
export {
  evaluateTouchTest,
  probeCameraCapability,
  probeBatteryCapability,
  probeAccelerometer,
  probeGyroscope,
  compileHealthReport,
} from './services/healthCheckService';
export { setApiBaseUrl, getApiBaseUrl } from './services/apiClient';

// Utilities
export {
  calculateHaversineDistanceKm,
  formatDistance,
  isValidCoordinate,
  DEFAULT_USER_COORDINATES,
  SRI_LANKA_CITY_PRESETS,
  findNearestCityPreset,
  formatLocationSourceLabel,
} from './utils/location';
export { evaluateLocalRecommendation } from './utils/ruleEngine';
export * from './utils/mockData';

// Types & Contracts
export * from './types';
export * from './types/healthCheck.types';

// Theme Constants
export * from './constants/theme';
