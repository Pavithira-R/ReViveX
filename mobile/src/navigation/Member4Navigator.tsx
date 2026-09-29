// ============================================================================
// Member 4 - Feature Navigator (Phases 1-5 Integration Flow)
// Demonstrates seamless local transitions across all 5 Member 4 phases
// ============================================================================

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ServiceProvider, RepairRequest, Booking } from '../types';

// Phase 1 Screens
import { ProviderListScreen } from '../features/member4/phase1-provider-profile/screens/ProviderListScreen';
import { ProviderProfileScreen } from '../features/member4/phase1-provider-profile/screens/ProviderProfileScreen';

// Phase 2 Screens
import { CreateRepairRequestScreen } from '../features/member4/phase2-repair-request/screens/CreateRepairRequestScreen';

// Phase 3 Screens
import { ProviderRequestsScreen } from '../features/member4/phase3-quotation-response/screens/ProviderRequestsScreen';

// Phase 4 Screens
import { RepairBookingScreen } from '../features/member4/phase4-booking/screens/RepairBookingScreen';

// Phase 5 Screens
import { RepairStatusTrackingScreen } from '../features/member4/phase5-status-tracking/screens/RepairStatusTrackingScreen';

export type ActiveScreen =
  | 'PROVIDER_LIST'
  | 'PROVIDER_PROFILE'
  | 'CREATE_REQUEST'
  | 'PROVIDER_REQUESTS_DASHBOARD'
  | 'BOOKING'
  | 'TRACKING';

export const Member4Navigator: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>('PROVIDER_LIST');
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [activeRepairRequest, setActiveRepairRequest] = useState<RepairRequest | null>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [isProviderView, setIsProviderView] = useState<boolean>(false);

  // Phase 1 -> Provider Profile
  const handleSelectProvider = (provider: ServiceProvider) => {
    setSelectedProvider(provider);
    setCurrentScreen('PROVIDER_PROFILE');
  };

  // Phase 1 -> Phase 2 (Request Repair)
  const handleRequestRepair = (provider: ServiceProvider) => {
    setSelectedProvider(provider);
    setCurrentScreen('CREATE_REQUEST');
  };

  // Phase 2 -> Phase 3 / Phase 5 (After Request Submission)
  const handleRequestSubmitted = (request: RepairRequest) => {
    setActiveRepairRequest(request);
    // Navigate to Provider Dashboard to review/accept or directly to tracking
    setCurrentScreen('PROVIDER_REQUESTS_DASHBOARD');
  };

  // Phase 3 -> Phase 4 / Phase 5
  const handleNavigateToTrackingFromProvider = (request: RepairRequest) => {
    setActiveRepairRequest(request);
    setIsProviderView(true);
    setCurrentScreen('TRACKING');
  };

  // Phase 4 -> Phase 5
  const handleBookingConfirmed = (booking: Booking) => {
    setActiveBooking(booking);
    setIsProviderView(false);
    setCurrentScreen('TRACKING');
  };

  return (
    <View style={styles.container}>
      {currentScreen === 'PROVIDER_LIST' && (
        <ProviderListScreen onSelectProvider={handleSelectProvider} />
      )}

      {currentScreen === 'PROVIDER_PROFILE' && (
        <ProviderProfileScreen
          providerId={selectedProvider?.id || 'prov_fixit_001'}
          onNavigateBack={() => setCurrentScreen('PROVIDER_LIST')}
          onRequestRepair={handleRequestRepair}
          onBookDirectly={() => {
            if (activeRepairRequest) {
              setCurrentScreen('BOOKING');
            } else {
              setCurrentScreen('CREATE_REQUEST');
            }
          }}
        />
      )}

      {currentScreen === 'CREATE_REQUEST' && selectedProvider && (
        <CreateRepairRequestScreen
          provider={selectedProvider}
          onNavigateBack={() => setCurrentScreen('PROVIDER_PROFILE')}
          onRequestSubmitted={handleRequestSubmitted}
        />
      )}

      {currentScreen === 'PROVIDER_REQUESTS_DASHBOARD' && (
        <ProviderRequestsScreen
          providerId={selectedProvider?.id || 'prov_fixit_001'}
          onNavigateToTracking={handleNavigateToTrackingFromProvider}
        />
      )}

      {currentScreen === 'BOOKING' && activeRepairRequest && (
        <RepairBookingScreen
          repairRequest={activeRepairRequest}
          onNavigateBack={() => setCurrentScreen('PROVIDER_PROFILE')}
          onBookingConfirmed={handleBookingConfirmed}
        />
      )}

      {currentScreen === 'TRACKING' && (
        <RepairStatusTrackingScreen
          requestId={activeRepairRequest?.id || 'req_rep_101'}
          isProviderView={isProviderView}
          onNavigateBack={() => setCurrentScreen('PROVIDER_LIST')}
          onNavigateToBooking={(req) => {
            setActiveRepairRequest(req);
            setCurrentScreen('BOOKING');
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
