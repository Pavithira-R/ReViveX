// Member 4 – Repair & Service Providers (Firebase)
// Central barrel export for Member 4 feature module

export * from './types';
export * from './repair.service';

// Screens
export { ProviderListScreen } from './phase1-provider-profile/screens/ProviderListScreen';
export { ProviderProfileScreen } from './phase1-provider-profile/screens/ProviderProfileScreen';
export { EditProviderProfileScreen } from './phase1-provider-profile/screens/EditProviderProfileScreen';
export { CreateRepairRequestScreen } from './phase2-repair-request/screens/CreateRepairRequestScreen';
export { ProviderRequestsScreen } from './phase3-quotation-response/screens/ProviderRequestsScreen';
export { RepairBookingScreen } from './phase4-booking/screens/RepairBookingScreen';
export { RepairStatusTrackingScreen } from './phase5-status-tracking/screens/RepairStatusTrackingScreen';

// Components
export { ProviderCard } from './phase1-provider-profile/components/ProviderCard';
export { QuotationModal } from './phase3-quotation-response/components/QuotationModal';
export { ProgressTracker } from './phase5-status-tracking/components/ProgressTracker';

// Navigator
export {
  Member4Navigator,
  type Member4Route,
  type Member4NavigatorProps,
  type RepairReviewTarget,
} from './navigation/Member4Navigator';

