import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RepairRequest, RepairStatus } from '../../types';
import { mobileStatusTrackingService } from '../statusTrackingService';
import { ProgressTracker } from '../components/ProgressTracker';
import { chatService } from '../../../../services';
import { Card, MessageBanner, PrimaryButton, StatusBadge } from '../../../../components';
import { formatLKR } from '../../../../utils';
import { COLORS, FONT, RADIUS, SPACING } from '../../../../constants';

interface RepairStatusTrackingScreenProps {
  requestId?: string;
  isProviderView?: boolean;
  onNavigateBack?: () => void;
  onNavigateToBooking?: (request: RepairRequest) => void;
  onLeaveReview?: (request: RepairRequest) => void;
  onChatWithProvider?: (providerId: string) => void;
}

export const RepairStatusTrackingScreen: React.FC<RepairStatusTrackingScreenProps> = ({
  requestId = 'req_rep_101',
  isProviderView = true,
  onNavigateBack,
  onNavigateToBooking,
  onLeaveReview,
  onChatWithProvider,
}) => {
  const [request, setRequest] = useState<RepairRequest | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [providerNoteInput, setProviderNoteInput] = useState<string>('');
  const [ecoAwardNotice, setEcoAwardNotice] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
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
  }, [requestId]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

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
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (error && !request) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <Pressable onPress={onNavigateBack} accessibilityRole="button" hitSlop={12}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
          <Text style={styles.topTitle}>Repair Status</Text>
          <View style={styles.topSpacer} />
        </View>
        <View style={styles.errorBox}>
          <MessageBanner message={error} />
          <PrimaryButton title="Try again" variant="outlined" onPress={loadStatus} />
        </View>
      </SafeAreaView>
    );
  }

  if (!request) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        {onNavigateBack ? (
          <Pressable onPress={onNavigateBack} accessibilityRole="button" hitSlop={12}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
        ) : (
          <View style={styles.topSpacer} />
        )}
        <Text style={styles.topTitle} numberOfLines={1}>
          Repair Live Tracking
        </Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Device & Status Overview */}
        <Card style={styles.overviewCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceTitle}>{request.itemSummary?.title || request.itemName || 'Electronic Device'}</Text>
              <Text style={styles.providerName}>
                Technician: {request.providerSummary?.businessName || request.providerName || 'Certified Technician'}
              </Text>
            </View>
            <StatusBadge status={request.status} />
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Agreed Repair Quotation:</Text>
            <Text style={styles.priceValue}>
              {formatLKR(request.estimatedPrice ?? request.quotation?.price)}
            </Text>
          </View>

          <View style={{ marginTop: SPACING.sm }}>
            <PrimaryButton
              title="Chat with Technician 💬"
              variant="outlined"
              onPress={async () => {
                if (onChatWithProvider) {
                  onChatWithProvider(request.providerId);
                } else {
                  try {
                    await chatService.startWithUser(request.providerId);
                  } catch (e) {
                    console.log('Chat start:', e);
                  }
                }
              }}
            />
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
                Repair complete. Eco-Points have been awarded to your account!
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
              placeholderTextColor={COLORS.textMuted}
              value={providerNoteInput}
              onChangeText={setProviderNoteInput}
            />

            <View style={styles.actionButtonsCol}>
              {request.status === RepairStatus.ACCEPTED && (
                <>
                  <PrimaryButton
                    title="Mark: On The Way"
                    variant="outlined"
                    onPress={() => handleUpdateStatus(RepairStatus.ON_THE_WAY)}
                    loading={isUpdating}
                  />
                  <View style={{ height: SPACING.xs }} />
                  <PrimaryButton
                    title="Mark: Repairing (In Progress)"
                    onPress={() => handleUpdateStatus(RepairStatus.REPAIRING)}
                    loading={isUpdating}
                  />
                </>
              )}

              {request.status === RepairStatus.ON_THE_WAY && (
                <PrimaryButton
                  title="Mark: Repairing (In Progress)"
                  onPress={() => handleUpdateStatus(RepairStatus.REPAIRING)}
                  loading={isUpdating}
                />
              )}

              {request.status === RepairStatus.REPAIRING && (
                <PrimaryButton
                  title="Mark as Completed 🎉"
                  onPress={() => handleUpdateStatus(RepairStatus.COMPLETED)}
                  loading={isUpdating}
                />
              )}
            </View>
          </Card>
        )}

        {/* Customer Actions */}
        {!isProviderView && request.status === RepairStatus.ACCEPTED && (
          <PrimaryButton
            title="Book Appointment for Drop-off →"
            onPress={() => onNavigateToBooking?.(request)}
          />
        )}

        {/* Leave Review Prompt when COMPLETED */}
        {request.status === RepairStatus.COMPLETED && (
          <Card style={[styles.overviewCard, { marginTop: SPACING.md, borderColor: COLORS.accent }]}>
            <Text style={styles.deviceTitle}>Repair Finished! ⭐</Text>
            <Text style={[styles.providerName, { marginBottom: SPACING.md }]}>
              Help others in the community by rating {request.providerName || 'the technician'}.
            </Text>
            <PrimaryButton
              title="Leave a Review"
              onPress={() => onLeaveReview?.(request)}
            />
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  back: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
    minWidth: 60,
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    flexShrink: 1,
    textAlign: 'center',
  },
  topSpacer: {
    minWidth: 60,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  loader: {
    marginTop: 40,
  },
  errorBox: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  overviewCard: {
    marginBottom: SPACING.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  deviceInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  deviceTitle: {
    fontSize: FONT.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  providerName: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  priceLabel: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
  },
  priceValue: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  stepperCard: {
    marginBottom: SPACING.md,
  },
  sectionHeading: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  ecoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  ecoIcon: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  ecoTextGroup: {
    flex: 1,
  },
  ecoTitle: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  ecoSubtitle: {
    fontSize: FONT.xs,
    color: COLORS.text,
    marginTop: 2,
  },
  notesCard: {
    backgroundColor: COLORS.surfaceSubtle,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  notesBody: {
    fontSize: FONT.xs,
    color: COLORS.text,
    marginTop: 4,
    lineHeight: 18,
  },
  notesTimestamp: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  providerActionCard: {
    marginBottom: SPACING.md,
  },
  controlHint: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  noteInput: {
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    fontSize: FONT.xs,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  actionButtonsCol: {
    gap: SPACING.xs,
  },
});
