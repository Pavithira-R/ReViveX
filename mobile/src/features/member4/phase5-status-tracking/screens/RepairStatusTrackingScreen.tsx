import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { RepairRequest, RepairStatus } from '../../../types';
import { mobileStatusTrackingService } from '../statusTrackingService';
import { ProgressTracker } from '../components/ProgressTracker';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../../theme';
import { Header } from '../../../components/common/Header';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { ErrorState } from '../../../components/common/ErrorState';

interface RepairStatusTrackingScreenProps {
  requestId?: string;
  isProviderView?: boolean;
  onNavigateBack?: () => void;
  onNavigateToBooking?: (request: RepairRequest) => void;
}

export const RepairStatusTrackingScreen: React.FC<RepairStatusTrackingScreenProps> = ({
  requestId = 'req_rep_101',
  isProviderView = true, // Toggleable for customer vs provider perspective
  onNavigateBack,
  onNavigateToBooking,
}) => {
  const [request, setRequest] = useState<RepairRequest | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [providerNoteInput, setProviderNoteInput] = useState<string>('');
  const [ecoAwardNotice, setEcoAwardNotice] = useState<string | null>(null);

  const loadStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await mobileStatusTrackingService.getRequestStatus(requestId);
      if (res.success && res.data) {
        setRequest(res.data);
      } else {
        setError(res.error || 'Failed to load tracking details');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [requestId]);

  const handleUpdateStatus = async (targetStatus: RepairStatus) => {
    if (!request) return;

    setIsUpdating(true);
    try {
      const res = await mobileStatusTrackingService.updateStatus(
        request.id,
        targetStatus,
        providerNoteInput.trim() ? providerNoteInput : undefined
      );

      if (res.success && res.data) {
        setRequest(res.data);
        if (targetStatus === RepairStatus.COMPLETED) {
          setEcoAwardNotice(
            '🌟 Device successfully repaired & saved from landfill! Eco impact hook triggered.'
          );
        }
      } else {
        setError(res.error || 'Status transition rejected');
      }
    } catch (err: any) {
      setError(err.message || 'Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Fetching repair progress..." />;
  }

  if (error && !request) {
    return (
      <View style={styles.container}>
        <Header title="Repair Status" showBack onBack={onNavigateBack} />
        <ErrorState message={error} onRetry={loadStatus} />
      </View>
    );
  }

  if (!request) return null;

  return (
    <View style={styles.container}>
      <Header
        title="Repair Live Tracking"
        subtitle={`Request #${request.id.substring(0, 12)}`}
        showBack={Boolean(onNavigateBack)}
        onBack={onNavigateBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Device & Status Overview */}
        <Card style={styles.overviewCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceTitle}>{request.itemSummary?.title || 'MacBook Pro 15"'}</Text>
              <Text style={styles.providerName}>
                Technician: {request.providerSummary?.businessName || 'FixIt Pro Electronics'}
              </Text>
            </View>
            <Badge
              label={request.status}
              variant={
                request.status === RepairStatus.COMPLETED
                  ? 'success'
                  : request.status === RepairStatus.IN_PROGRESS
                  ? 'info'
                  : request.status === RepairStatus.ACCEPTED
                  ? 'primary'
                  : 'warning'
              }
            />
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Agreed Repair Quotation:</Text>
            <Text style={styles.priceValue}>
              ${request.estimatedPrice ? request.estimatedPrice.toFixed(2) : '85.00'} USD
            </Text>
          </View>
        </Card>

        {/* Visual Progress Stepper */}
        <Card style={styles.stepperCard}>
          <Text style={styles.sectionHeading}>Repair Lifecycle Progress</Text>
          <ProgressTracker currentStatus={request.status} />
        </Card>

        {/* Eco Award Banner upon Completion */}
        {ecoAwardNotice || request.status === RepairStatus.COMPLETED ? (
          <View style={styles.ecoBanner}>
            <Text style={styles.ecoIcon}>🌱</Text>
            <View style={styles.ecoTextGroup}>
              <Text style={styles.ecoTitle}>Eco-Impact Milestone Ready</Text>
              <Text style={styles.ecoSubtitle}>
                Repair complete. Ready for Member 6 Eco-Points calculation & Review submission.
              </Text>
            </View>
          </View>
        ) : null}

        {/* Provider Latest Notes / Log */}
        {request.providerNotes ? (
          <Card style={styles.notesCard}>
            <Text style={styles.notesLabel}>Latest Technician Log:</Text>
            <Text style={styles.notesBody}>{request.providerNotes}</Text>
            <Text style={styles.notesTimestamp}>
              Updated {new Date(request.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </Card>
        ) : null}

        {/* Provider Action Panel (if provider view) */}
        {isProviderView && request.status !== RepairStatus.COMPLETED && (
          <Card style={styles.providerActionCard}>
            <Text style={styles.sectionHeading}>Provider Status Controls</Text>
            <Text style={styles.controlHint}>
              Advance the repair status as you progress with diagnostic and replacement work.
            </Text>

            <TextInput
              style={styles.noteInput}
              placeholder="Add status update note for the customer..."
              value={providerNoteInput}
              onChangeText={setProviderNoteInput}
            />

            <View style={styles.actionButtonsRow}>
              {request.status === RepairStatus.ACCEPTED && (
                <Button
                  title="Start Repair (In Progress)"
                  onPress={() => handleUpdateStatus(RepairStatus.IN_PROGRESS)}
                  loading={isUpdating}
                  variant="primary"
                  size="md"
                  style={styles.actionBtn}
                />
              )}

              {request.status === RepairStatus.IN_PROGRESS && (
                <Button
                  title="Mark as Completed"
                  onPress={() => handleUpdateStatus(RepairStatus.COMPLETED)}
                  loading={isUpdating}
                  variant="primary"
                  size="md"
                  style={styles.actionBtn}
                />
              )}
            </View>
          </Card>
        )}

        {/* Customer Action (if customer view and accepted, prompt booking) */}
        {!isProviderView && request.status === RepairStatus.ACCEPTED && (
          <Button
            title="Book Appointment for Drop-off →"
            onPress={() => onNavigateToBooking?.(request)}
            variant="primary"
            size="lg"
            style={styles.customerBookingBtn}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  overviewCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  deviceInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  deviceTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
  },
  providerName: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  priceLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
  },
  priceValue: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.primaryDark,
  },
  stepperCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  sectionHeading: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  ecoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  ecoIcon: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  ecoTextGroup: {
    flex: 1,
  },
  ecoTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.success,
  },
  ecoSubtitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  notesCard: {
    backgroundColor: Colors.surfaceSubtle,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textSecondary,
  },
  notesBody: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textPrimary,
    marginTop: 4,
    lineHeight: 18,
  },
  notesTimestamp: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
  },
  providerActionCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  controlHint: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  noteInput: {
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: Typography.fontSizes.xs,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
  customerBookingBtn: {
    marginTop: Spacing.sm,
  },
});
