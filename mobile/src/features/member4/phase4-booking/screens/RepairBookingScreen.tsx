import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RepairRequest, Booking, BookingStatus } from '../../types';
import { mobileBookingService } from '../bookingService';
import { useAuth } from '../../../../context';
import { Card, MessageBanner, PrimaryButton, StatusBadge } from '../../../../components';
import { COLORS, FONT, RADIUS, SHADOW, SPACING } from '../../../../constants';

interface RepairBookingScreenProps {
  repairRequest: RepairRequest;
  onNavigateBack?: () => void;
  onBookingConfirmed?: (booking: Booking) => void;
}

const AVAILABLE_TIMES = [
  '09:30 AM',
  '11:00 AM',
  '01:30 PM',
  '03:00 PM',
  '04:30 PM',
];

export const RepairBookingScreen: React.FC<RepairBookingScreenProps> = ({
  repairRequest,
  onNavigateBack,
  onBookingConfirmed,
}) => {
  const { user } = useAuth();

  const [appointmentDate, setAppointmentDate] = useState<string>('2025-04-12');
  const [appointmentTime, setAppointmentTime] = useState<string>(AVAILABLE_TIMES[0]);
  const [bookingNotes, setBookingNotes] = useState<string>('Will bring charger along with laptop.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  const handleConfirmBooking = async () => {
    if (!appointmentDate.trim()) {
      setErrorMessage('Please specify an appointment date.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await mobileBookingService.createBooking({
        repairRequestId: repairRequest.id,
        customerId: user?.uid || repairRequest.customerId,
        providerId: repairRequest.providerId,
        appointmentDate: new Date(appointmentDate).toISOString(),
        appointmentTime,
        notes: bookingNotes.trim() ? bookingNotes : undefined,
      });

      if (response.success && response.data) {
        setConfirmedBooking(response.data);
      } else {
        setErrorMessage(response.error || 'Failed to complete booking');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (confirmedBooking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <View style={styles.topSpacer} />
          <Text style={styles.topTitle}>Booking Confirmed</Text>
          <View style={styles.topSpacer} />
        </View>
        <ScrollView contentContainerStyle={styles.successContainer}>
          <View style={styles.successBadgeCircle}>
            <Text style={styles.successBadgeEmoji}>🎉</Text>
          </View>
          <Text style={styles.confirmedTitle}>Appointment Confirmed!</Text>
          <Text style={styles.confirmedSubtitle}>
            Your repair appointment has been locked with{' '}
            <Text style={styles.boldText}>
              {repairRequest.providerSummary?.businessName || repairRequest.providerName || 'Technician'}
            </Text>
            .
          </Text>

          <Card style={styles.confirmationCard}>
            <View style={styles.codeBanner}>
              <Text style={styles.codeBannerLabel}>Confirmation Code</Text>
              <Text style={styles.codeBannerValue}>{confirmedBooking.confirmationCode}</Text>
            </View>

            <View style={styles.cardDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Device:</Text>
                <Text style={styles.detailValue}>
                  {repairRequest.itemSummary?.title || repairRequest.itemName || 'MacBook Pro 15"'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Appointment:</Text>
                <Text style={styles.detailValue}>
                  {appointmentDate} at {appointmentTime}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Agreed Quotation:</Text>
                <Text style={[styles.detailValue, { color: COLORS.primaryDark, fontWeight: '700' }]}>
                  ${repairRequest.estimatedPrice ? repairRequest.estimatedPrice.toFixed(2) : (repairRequest.quotation?.price || 85).toFixed(2)} USD
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Booking Status:</Text>
                <StatusBadge status="CONFIRMED" />
              </View>
            </View>
          </Card>

          <Text style={styles.instructionNotice}>
            Please arrive 10 minutes early. Present your Confirmation Code upon device hand-off.
          </Text>

          <PrimaryButton
            title="Track Repair Progress"
            onPress={() => onBookingConfirmed?.(confirmedBooking)}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

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
          Schedule Appointment
        </Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Repair & Quotation Summary Card */}
        <Card style={styles.summaryCard}>
          <Text style={styles.sectionHeader}>Repair Summary & Accepted Quotation</Text>
          <View style={styles.summaryItemRow}>
            <Text style={styles.summaryLabel}>Device:</Text>
            <Text style={styles.summaryValue}>
              {repairRequest.itemSummary?.title || repairRequest.itemName || 'Electronic Device'}
            </Text>
          </View>
          <View style={styles.summaryItemRow}>
            <Text style={styles.summaryLabel}>Provider:</Text>
            <Text style={styles.summaryValue}>
              {repairRequest.providerSummary?.businessName || repairRequest.providerName || 'Technician'}
            </Text>
          </View>
          <View style={styles.summaryItemRow}>
            <Text style={styles.summaryLabel}>Quoted Price:</Text>
            <Text style={[styles.summaryValue, styles.highlightPrice]}>
              ${repairRequest.estimatedPrice ? repairRequest.estimatedPrice.toFixed(2) : (repairRequest.quotation?.price || 85).toFixed(2)} USD
            </Text>
          </View>
          {repairRequest.providerNotes ? (
            <View style={styles.providerNotesBox}>
              <Text style={styles.providerNotesText}>
                💬 Provider Note: {repairRequest.providerNotes}
              </Text>
            </View>
          ) : null}
        </Card>

        {/* Customer Information Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.sectionHeader}>Customer Details</Text>
          <View style={styles.summaryItemRow}>
            <Text style={styles.summaryLabel}>Name:</Text>
            <Text style={styles.summaryValue}>{user?.name || repairRequest.customerName || 'Customer'}</Text>
          </View>
          <View style={styles.summaryItemRow}>
            <Text style={styles.summaryLabel}>Email:</Text>
            <Text style={styles.summaryValue}>{user?.email || 'N/A'}</Text>
          </View>
          <View style={styles.summaryItemRow}>
            <Text style={styles.summaryLabel}>User ID:</Text>
            <Text style={styles.summaryValue}>{user?.uid ? user.uid.substring(0, 8) + '...' : 'Signed In'}</Text>
          </View>
        </Card>

        {/* Date Selection */}
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Select Drop-off / Service Date *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.textMuted}
            value={appointmentDate}
            onChangeText={setAppointmentDate}
          />
        </View>

        {/* Time Slot Selection */}
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Select Available Time Slot *</Text>
          <View style={styles.timeGrid}>
            {AVAILABLE_TIMES.map((time) => {
              const isSelected = appointmentTime === time;
              return (
                <Pressable
                  key={time}
                  style={[styles.timeChip, isSelected && styles.selectedTimeChip]}
                  onPress={() => setAppointmentTime(time)}
                >
                  <Text style={[styles.timeChipText, isSelected && styles.selectedTimeChipText]}>
                    {time}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Optional Notes */}
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Drop-off Instructions / Hand-over Notes</Text>
          <TextInput
            style={styles.textArea}
            placeholder="e.g. Bringing device in original box with charger..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={2}
            value={bookingNotes}
            onChangeText={setBookingNotes}
          />
        </View>

        {errorMessage ? (
          <View style={{ marginBottom: SPACING.md }}>
            <MessageBanner message={errorMessage} />
          </View>
        ) : null}

        <PrimaryButton
          title="Confirm & Lock Appointment"
          onPress={handleConfirmBooking}
          loading={isSubmitting}
        />
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
  summaryCard: {
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.xs,
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  summaryLabel: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
  },
  summaryValue: {
    fontSize: FONT.xs,
    fontWeight: '600',
    color: COLORS.text,
  },
  highlightPrice: {
    color: COLORS.primaryDark,
    fontSize: FONT.sm,
    fontWeight: '700',
  },
  providerNotesBox: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.sm,
    padding: SPACING.xs + 2,
    marginTop: SPACING.xs,
  },
  providerNotesText: {
    fontSize: 11,
    color: COLORS.text,
  },
  formSection: {
    marginBottom: SPACING.md,
  },
  formLabel: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    fontSize: FONT.sm,
    color: COLORS.text,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  timeChip: {
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedTimeChip: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  timeChipText: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  selectedTimeChipText: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  textArea: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    fontSize: FONT.sm,
    color: COLORS.text,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  successContainer: {
    alignItems: 'center',
    padding: SPACING.lg,
  },
  successBadgeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  successBadgeEmoji: {
    fontSize: 32,
  },
  confirmedTitle: {
    fontSize: FONT.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  confirmedSubtitle: {
    fontSize: FONT.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  boldText: {
    fontWeight: '700',
    color: COLORS.text,
  },
  confirmationCard: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  codeBanner: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  codeBannerLabel: {
    fontSize: 11,
    color: COLORS.primaryDark,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  codeBannerValue: {
    fontSize: FONT.xl,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginTop: 2,
    letterSpacing: 2,
  },
  cardDetails: {
    gap: SPACING.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  detailLabel: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
  },
  detailValue: {
    fontSize: FONT.xs,
    fontWeight: '600',
    color: COLORS.text,
  },
  instructionNotice: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
});
