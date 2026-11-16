// ============================================================================
// Member 4 - Feature Navigator (Repair & Service Providers)
// Coordinates all 5 phases of repair workflow and cross-module handoffs
// ============================================================================

import React, { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { Booking, RepairRequest, ServiceProvider } from '../types';
import { ProviderListScreen } from '../phase1-provider-profile/screens/ProviderListScreen';
import { ProviderProfileScreen } from '../phase1-provider-profile/screens/ProviderProfileScreen';
import { EditProviderProfileScreen } from '../phase1-provider-profile/screens/EditProviderProfileScreen';
import { CreateRepairRequestScreen } from '../phase2-repair-request/screens/CreateRepairRequestScreen';
import { ProviderRequestsScreen } from '../phase3-quotation-response/screens/ProviderRequestsScreen';
import { RepairBookingScreen } from '../phase4-booking/screens/RepairBookingScreen';
import { RepairStatusTrackingScreen } from '../phase5-status-tracking/screens/RepairStatusTrackingScreen';
import { useAuth } from '../../../context';
import { COLORS } from '../../../constants';

export type Member4Route =
  | 'PROVIDER_LIST'
  | 'PROVIDER_PROFILE'
  | 'EDIT_PROVIDER_PROFILE'
  | 'CREATE_REQUEST'
  | 'PROVIDER_REQUESTS'
  | 'BOOKING'
  | 'STATUS_TRACKING';

export interface RepairReviewTarget {
  revieweeId: string;
  revieweeName: string;
  refType: 'REPAIR';
  refId: string;
  subject?: string;
}

export interface Member4NavigatorProps {
  initialRoute?: Member4Route;
  initialProviderId?: string;
  initialRequestId?: string;
  onBack: () => void;
  onLeaveReview?: (target: RepairReviewTarget) => void;
  onChatWithProvider?: (providerId: string) => void;
}

export const Member4Navigator: React.FC<Member4NavigatorProps> = ({
  initialRoute = 'PROVIDER_LIST',
  initialProviderId,
  initialRequestId,
  onBack,
  onLeaveReview,
  onChatWithProvider,
}) => {
  const { user } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<Member4Route>(initialRoute);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string | undefined>(
    initialProviderId
  );
  const [selectedRequestId, setSelectedRequestId] = useState<string | undefined>(
    initialRequestId
  );
  const [activeRequestForBooking, setActiveRequestForBooking] = useState<RepairRequest | null>(
    null
  );
  const [isProviderView, setIsProviderView] = useState<boolean>(
    initialRoute === 'PROVIDER_REQUESTS'
  );

  // Hardware back press handler within Member4
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentRoute === 'CREATE_REQUEST') {
        setCurrentRoute(selectedProvider ? 'PROVIDER_PROFILE' : 'PROVIDER_LIST');
        return true;
      }
      if (currentRoute === 'BOOKING') {
        setCurrentRoute('STATUS_TRACKING');
        return true;
      }
      if (currentRoute === 'STATUS_TRACKING') {
        if (isProviderView) {
          setCurrentRoute('PROVIDER_REQUESTS');
        } else {
          setCurrentRoute(selectedProvider ? 'PROVIDER_PROFILE' : 'PROVIDER_LIST');
        }
        return true;
      }
      if (currentRoute === 'PROVIDER_PROFILE') {
        if (initialRoute === 'PROVIDER_PROFILE') {
          onBack();
        } else {
          setCurrentRoute('PROVIDER_LIST');
        }
        return true;
      }
      if (currentRoute === 'PROVIDER_LIST' || currentRoute === 'PROVIDER_REQUESTS' || currentRoute === 'EDIT_PROVIDER_PROFILE') {
        onBack();
        return true;
      }
      return false;
    });

    return () => subscription.remove();
  }, [currentRoute, selectedProvider, isProviderView, initialRoute, onBack]);

  // Handle provider selection from list
  const handleSelectProvider = (provider: ServiceProvider) => {
    setSelectedProvider(provider);
    setSelectedProviderId(provider.id || provider.userId);
    setCurrentRoute('PROVIDER_PROFILE');
  };

  // Handle request repair button from provider profile
  const handleRequestRepair = (provider: ServiceProvider) => {
    setSelectedProvider(provider);
    setCurrentRoute('CREATE_REQUEST');
  };

  // Handle repair request submission
  const handleRequestSubmitted = (req: RepairRequest) => {
    setSelectedRequestId(req.id);
    setIsProviderView(false);
    setCurrentRoute('STATUS_TRACKING');
  };

  // Handle provider opening tracking from incoming requests
  const handleProviderOpenTracking = (req: RepairRequest) => {
    setSelectedRequestId(req.id);
    setIsProviderView(true);
    setCurrentRoute('STATUS_TRACKING');
  };

  // Handle customer moving from tracking to booking an appointment
  const handleNavigateToBooking = (req: RepairRequest) => {
    setActiveRequestForBooking(req);
    setCurrentRoute('BOOKING');
  };

  // Handle booking completion
  const handleBookingConfirmed = (booking: Booking) => {
    setSelectedRequestId(booking.repairRequestId);
    setCurrentRoute('STATUS_TRACKING');
  };

  // Handle leave review completion
  const handleLeaveReview = (req: RepairRequest) => {
    if (onLeaveReview) {
      onLeaveReview({
        revieweeId: req.providerId,
        revieweeName: req.providerName || 'Technician',
        refType: 'REPAIR',
        refId: req.id,
        subject: req.categoryName ? `${req.categoryName} repair` : 'Device repair',
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Provider Directory List */}
      {currentRoute === 'PROVIDER_LIST' && (
        <ProviderListScreen
          onSelectProvider={handleSelectProvider}
          onBack={onBack}
        />
      )}

      {/* 2. Provider Profile View */}
      {currentRoute === 'PROVIDER_PROFILE' && (
        <ProviderProfileScreen
          providerId={selectedProviderId || selectedProvider?.id || selectedProvider?.userId}
          onNavigateBack={() => {
            if (initialRoute === 'PROVIDER_PROFILE') {
              onBack();
            } else {
              setCurrentRoute('PROVIDER_LIST');
            }
          }}
          onRequestRepair={handleRequestRepair}
          onBookDirectly={handleRequestRepair}
        />
      )}

      {/* 3. Create Repair Request Form */}
      {currentRoute === 'CREATE_REQUEST' && selectedProvider && (
        <CreateRepairRequestScreen
          provider={selectedProvider}
          onNavigateBack={() => setCurrentRoute('PROVIDER_PROFILE')}
          onRequestSubmitted={handleRequestSubmitted}
        />
      )}

      {/* 4. Service Provider: Incoming Requests & Quotations */}
      {currentRoute === 'PROVIDER_REQUESTS' && (
        <ProviderRequestsScreen
          providerId={user?.id || 'prov_fixit_001'}
          onNavigateToTracking={handleProviderOpenTracking}
          onBack={onBack}
        />
      )}

      {/* 5. Booking Appointment Screen */}
      {currentRoute === 'BOOKING' && activeRequestForBooking && (
        <RepairBookingScreen
          repairRequest={activeRequestForBooking}
          onNavigateBack={() => setCurrentRoute('STATUS_TRACKING')}
          onBookingConfirmed={handleBookingConfirmed}
        />
      )}

      {/* 6. Live Status Tracking Screen */}
      {currentRoute === 'STATUS_TRACKING' && (
        <RepairStatusTrackingScreen
          requestId={selectedRequestId}
          isProviderView={isProviderView}
          onNavigateBack={() => {
            if (isProviderView) {
              setCurrentRoute('PROVIDER_REQUESTS');
            } else {
              setCurrentRoute(selectedProvider ? 'PROVIDER_PROFILE' : 'PROVIDER_LIST');
            }
          }}
          onNavigateToBooking={handleNavigateToBooking}
          onLeaveReview={handleLeaveReview}
          onChatWithProvider={onChatWithProvider}
        />
      )}

      {/* 7. Technician Business Profile Setup */}
      {currentRoute === 'EDIT_PROVIDER_PROFILE' && (
        <EditProviderProfileScreen
          onBack={onBack}
          onProfileSaved={() => {
            setCurrentRoute('PROVIDER_REQUESTS');
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
