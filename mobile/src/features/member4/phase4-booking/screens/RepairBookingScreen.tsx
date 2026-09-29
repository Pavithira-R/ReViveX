import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { RepairRequest, Booking, BookingStatus } from '../../../types';
import { mobileBookingService } from '../bookingService';
import { MobileAuthAdapter } from '../../../adapters/mockIntegrationAdapters';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../../theme';
import { Header } from '../../../components/common/Header';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';

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
  const customer = MobileAuthAdapter.getCurrentCustomer();

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
        customerId: customer.id,
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
      <View style={styles.container}>
        <Header title="Booking Confirmed" />
        <ScrollView contentContainerStyle={styles.successContainer}>
          <View style={styles.successBadgeCircle}>
            <Text style={styles.successBadgeEmoji}>🎉</Text>
          </View>
          <Text style={styles.confirmedTitle}>Appointment Confirmed!</Text>
          <Text style={styles.confirmedSubtitle}>
            Your repair appointment has been locked with{' '}
            <Text style={styles.boldText}>
              {repairRequest.providerSummary?.businessName || 'FixIt Pro'}
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
                  {repairRequest.itemSummary?.title || 'MacBook Pro 15"'}
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
                <Text style={[styles.detailValue, { color: Colors.primaryDark, fontWeight: '700' }]}>
                  ${repairRequest.estimatedPrice?.toFixed(2) || '85.00'} USD
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Booking Status:</Text>
                <Badge label="CONFIRMED" variant="success" size="sm" />
              </View>
            </View>
          </Card>

          <Text style={styles.instructionNotice}>
            Please arrive 10 minutes early. Present your Confirmation Code upon device hand-off.
          </Text>

          <Button
            title="Track Repair Progress"
            variant="primary"
            size="lg"
            onPress={() => onBookingConfirmed?.(confirmedBooking)}
            style={styles.fullWidthBtn}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Schedule Appointment"
        subtitle="Step 2 of 3: Date & Drop-off Time"
        showBack={Boolean(onNavigateBack)}
        onBack={onNavigateBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Repair & Quotation Summary Card */}
        <Card style={styles.summaryCard}>
          <Text style={styles.sectionHeader}>Repair Summary & Accepted Quotation</Text>
          <View style={styles.summaryItemRow}>
            <Text style={styles.summaryLabel}>Device:</Text>
            <Text style={styles.summaryValue}>
              {repairRequest.itemSummary?.title || 'MacBook Pro 15"'}
            </Text>
          </View>
          <View style={styles.summaryItemRow}>
            <Text style={styles.summaryLabel}>Provider:</Text>
            <Text style={styles.summaryValue}>
              {repairRequest.providerSummary?.businessName || 'FixIt Pro Electronics'}
            </Text>
          </View>
          <View style={styles.summaryItemRow}>
            <Text style={styles.summaryLabel}>Quoted Price:</Text>
            <Text style={[styles.summaryValue, styles.highlightPrice]}>
              ${repairRequest.estimatedPrice ? repairRequest.estimatedPrice.toFixed(2) : '85.00'} USD
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
            <Text style={styles.summaryValue}>{customer.name}</Text>
          </View>
          <View style={styles.summaryItemRow}>
            <Text style={styles.summaryLabel}>Email:</Text>
            <Text style={styles.summaryValue}>{customer.email}</Text>
          </View>
          <View style={styles.summaryItemRow}>
            <Text style={styles.summaryLabel}>Phone:</Text>
            <Text style={styles.summaryValue}>{customer.phone}</Text>
          </View>
        </Card>

        {/* Date Selection */}
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Select Drop-off / Service Date *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
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
                <TouchableOpacity
                  key={time}
                  style={[styles.timeChip, isSelected && styles.selectedTimeChip]}
                  onPress={() => setAppointmentTime(time)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.timeChipText, isSelected && styles.selectedTimeChipText]}>
                    {time}
                  </Text>
                </TouchableOpacity>
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
            multiline
            numberOfLines={2}
            value={bookingNotes}
            onChangeText={setBookingNotes}
          />
        </View>

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        ) : null}

        <Button
          title="Confirm & Lock Appointment"
          onPress={handleConfirmBooking}
          loading={isSubmitting}
          variant="primary"
          size="lg"
          style={styles.confirmButton}
        />
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
  summaryCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: Spacing.xs,
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.textPrimary,
  },
  highlightPrice: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.primaryDark,
  },
  providerNotesBox: {
    backgroundColor: Colors.primaryLight,
    padding: Spacing.xs + 2,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  providerNotesText: {
    fontSize: 11,
    color: Colors.primaryDark,
  },
  formSection: {
    marginBottom: Spacing.md,
  },
  formLabel: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: Typography.fontSizes.sm,
    color: Colors.textPrimary,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  timeChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
  },
  selectedTimeChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeChipText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeights.medium,
  },
  selectedTimeChipText: {
    color: Colors.textWhite,
    fontWeight: Typography.fontWeights.bold,
  },
  textArea: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSizes.sm,
    color: Colors.textPrimary,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  errorBanner: {
    backgroundColor: Colors.dangerLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorBannerText: {
    color: Colors.danger,
    fontSize: Typography.fontSizes.sm,
  },
  confirmButton: {
    marginTop: Spacing.sm,
  },
  successContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  successBadgeCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  successBadgeEmoji: {
    fontSize: 32,
  },
  confirmedTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  confirmedSubtitle: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  boldText: {
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
  },
  confirmationCard: {
    width: '100%',
    marginBottom: Spacing.lg,
    padding: 0,
    overflow: 'hidden',
  },
  codeBanner: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    alignItems: 'center',
  },
  codeBannerLabel: {
    color: Colors.primaryLight,
    fontSize: 11,
    fontWeight: Typography.fontWeights.medium,
  },
  codeBannerValue: {
    color: Colors.textWhite,
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.bold,
    letterSpacing: 2,
    marginTop: 2,
  },
  cardDetails: {
    padding: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs + 2,
  },
  detailLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.textPrimary,
  },
  instructionNotice: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  fullWidthBtn: {
    width: '100%',
  },
});
