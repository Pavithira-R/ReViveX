import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  TouchableOpacity,
} from 'react-native';
import { ServiceProvider, RepairRequest } from '../../../types';
import { mobileRepairRequestService } from '../repairRequestService';
import { MobileItemAdapter } from '../../../adapters/mockIntegrationAdapters';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../../theme';
import { Header } from '../../../components/common/Header';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';

interface CreateRepairRequestScreenProps {
  provider: ServiceProvider;
  onNavigateBack?: () => void;
  onRequestSubmitted?: (request: RepairRequest) => void;
}

const TIME_SLOTS = [
  'Morning (9:00 AM - 12:00 PM)',
  'Afternoon (1:00 PM - 4:00 PM)',
  'Late Afternoon (4:00 PM - 6:00 PM)',
];

export const CreateRepairRequestScreen: React.FC<CreateRepairRequestScreenProps> = ({
  provider,
  onNavigateBack,
  onRequestSubmitted,
}) => {
  const item = MobileItemAdapter.getSelectedItem();

  const [problemDescription, setProblemDescription] = useState<string>('');
  const [preferredDate, setPreferredDate] = useState<string>('2025-04-10');
  const [preferredTime, setPreferredTime] = useState<string>(TIME_SLOTS[0]);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submittedRequest, setSubmittedRequest] = useState<RepairRequest | null>(null);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!problemDescription.trim()) {
      errors.problemDescription = 'Please describe the issue with your device.';
    } else if (problemDescription.trim().length < 10) {
      errors.problemDescription = 'Please provide at least 10 characters detailing the problem.';
    }

    if (!preferredDate.trim()) {
      errors.preferredDate = 'Preferred service date is required.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await mobileRepairRequestService.submitRepairRequest({
        itemId: item.id,
        providerId: provider.id,
        problemDescription,
        preferredDate: new Date(preferredDate).toISOString(),
        preferredTime,
        notes: notes.trim() ? notes : undefined,
      });

      if (response.success && response.data) {
        setSubmittedRequest(response.data);
      } else {
        setErrorMessage(response.error || 'Failed to submit repair request');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedRequest) {
    return (
      <View style={styles.container}>
        <Header title="Request Submitted" />
        <ScrollView contentContainerStyle={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <Text style={styles.successCheck}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Repair Request Sent!</Text>
          <Text style={styles.successSubtitle}>
            Your repair request has been delivered to <Text style={styles.boldText}>{provider.businessName}</Text>.
          </Text>

          <Card style={styles.summaryCard}>
            <Text style={styles.summaryHeading}>Request Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Request ID:</Text>
              <Text style={styles.summaryValue}>{submittedRequest.id}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Device:</Text>
              <Text style={styles.summaryValue}>{item.title}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Provider:</Text>
              <Text style={styles.summaryValue}>{provider.businessName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Preferred Slot:</Text>
              <Text style={styles.summaryValue}>{preferredDate} ({preferredTime})</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Status:</Text>
              <Badge label="POSTED" variant="warning" size="sm" />
            </View>
          </Card>

          <Text style={styles.nextStepNotice}>
            The provider will review your request and submit a formal price quotation shortly.
          </Text>

          <Button
            title="View Request & Status"
            onPress={() => onRequestSubmitted?.(submittedRequest)}
            variant="primary"
            size="lg"
            style={styles.doneButton}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Request Repair"
        subtitle="Step 1 of 3: Problem Description"
        showBack={Boolean(onNavigateBack)}
        onBack={onNavigateBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Selected Item Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>1. Selected Device</Text>
          <Card style={styles.itemCard}>
            <View style={styles.itemRow}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
              ) : (
                <View style={styles.itemImageFallback}>
                  <Text>💻</Text>
                </View>
              )}
              <View style={styles.itemDetails}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemCategory}>Category: {item.category}</Text>
                <Badge label={item.condition} variant="neutral" size="sm" style={styles.itemBadge} />
              </View>
            </View>
          </Card>
        </View>

        {/* Selected Provider Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>2. Target Service Provider</Text>
          <Card style={styles.providerCard}>
            <View style={styles.providerRow}>
              <View style={styles.providerAvatarCircle}>
                <Text style={styles.providerAvatarText}>
                  {provider.businessName.substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.providerDetails}>
                <View style={styles.providerTitleRow}>
                  <Text style={styles.providerBusinessName}>{provider.businessName}</Text>
                  {provider.isVerified && <Badge label="Verified" variant="success" size="sm" />}
                </View>
                <Text style={styles.providerLocation}>📍 {provider.location}</Text>
                <Text style={styles.providerRating}>★ {provider.rating.toFixed(1)} ({provider.reviewCount} reviews)</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Problem Description Input */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>3. Problem Description *</Text>
          <Text style={styles.fieldHint}>
            Please describe symptoms, errors, physical damage, or battery behavior.
          </Text>
          <TextInput
            style={[
              styles.textArea,
              Boolean(validationErrors.problemDescription) && styles.inputError,
            ]}
            placeholder="e.g. Battery drains rapidly within 30 minutes, laptop overheats, and fans run at full speed..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            value={problemDescription}
            onChangeText={(val) => {
              setProblemDescription(val);
              if (validationErrors.problemDescription) {
                setValidationErrors({ ...validationErrors, problemDescription: '' });
              }
            }}
          />
          {validationErrors.problemDescription ? (
            <Text style={styles.errorText}>{validationErrors.problemDescription}</Text>
          ) : null}
        </View>

        {/* Preferred Date & Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>4. Preferred Service Date *</Text>
          <TextInput
            style={[
              styles.input,
              Boolean(validationErrors.preferredDate) && styles.inputError,
            ]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.textMuted}
            value={preferredDate}
            onChangeText={(val) => {
              setPreferredDate(val);
              if (validationErrors.preferredDate) {
                setValidationErrors({ ...validationErrors, preferredDate: '' });
              }
            }}
          />
          {validationErrors.preferredDate ? (
            <Text style={styles.errorText}>{validationErrors.preferredDate}</Text>
          ) : null}

          <Text style={[styles.sectionLabel, { marginTop: Spacing.md }]}>Preferred Time Window</Text>
          <View style={styles.timeSlotsContainer}>
            {TIME_SLOTS.map((slot) => {
              const isSelected = preferredTime === slot;
              return (
                <TouchableOpacity
                  key={slot}
                  style={[styles.timeSlotOption, isSelected && styles.selectedTimeSlot]}
                  onPress={() => setPreferredTime(slot)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.timeSlotText, isSelected && styles.selectedTimeSlotText]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Optional Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>5. Additional Notes (Optional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Any specific instructions, backup status, or urgency..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={2}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Global Error Banner */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Submit Action */}
        <Button
          title="Submit Repair Request"
          onPress={handleSubmit}
          loading={isSubmitting}
          variant="primary"
          size="lg"
          style={styles.submitButton}
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
  section: {
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  fieldHint: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  itemCard: {
    backgroundColor: Colors.surface,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
    backgroundColor: Colors.surfaceSubtle,
  },
  itemImageFallback: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceSubtle,
    marginRight: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
  },
  itemCategory: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemBadge: {
    marginTop: 4,
  },
  providerCard: {
    backgroundColor: Colors.surface,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  providerAvatarText: {
    fontWeight: Typography.fontWeights.bold,
    color: Colors.primaryDark,
    fontSize: Typography.fontSizes.sm,
  },
  providerDetails: {
    flex: 1,
  },
  providerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  providerBusinessName: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
  },
  providerLocation: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  providerRating: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.accent,
    marginTop: 1,
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
  textArea: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSizes.sm,
    color: Colors.textPrimary,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },
  errorText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.danger,
    marginTop: 4,
  },
  timeSlotsContainer: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  timeSlotOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  selectedTimeSlot: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  timeSlotText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textPrimary,
  },
  selectedTimeSlotText: {
    color: Colors.primaryDark,
    fontWeight: Typography.fontWeights.bold,
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
    fontWeight: Typography.fontWeights.medium,
  },
  submitButton: {
    marginTop: Spacing.sm,
  },
  successContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  successCheck: {
    fontSize: 32,
    color: Colors.success,
    fontWeight: Typography.fontWeights.bold,
  },
  successTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  boldText: {
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
  },
  summaryCard: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  summaryHeading: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: Spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs + 2,
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
  nextStepNotice: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  doneButton: {
    width: '100%',
  },
});
