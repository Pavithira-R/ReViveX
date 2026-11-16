import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ServiceProvider, RepairRequest } from '../../types';
import { mobileRepairRequestService } from '../repairRequestService';
import { Card, MessageBanner, PrimaryButton, StatusBadge } from '../../../../components';
import { COLORS, FONT, RADIUS, SPACING } from '../../../../constants';

export interface DeviceItemSummary {
  id: string;
  title: string;
  category: string;
  condition?: string;
  imageUrl?: string;
}

interface CreateRepairRequestScreenProps {
  provider: ServiceProvider;
  item?: DeviceItemSummary;
  onNavigateBack?: () => void;
  onRequestSubmitted?: (request: RepairRequest) => void;
}

const DEFAULT_ITEM: DeviceItemSummary = {
  id: 'item_dev_001',
  title: 'MacBook Pro 15" (2019)',
  category: 'Laptops',
  condition: 'Used - Good',
  imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8',
};

const TIME_SLOTS = [
  'Morning (9:00 AM - 12:00 PM)',
  'Afternoon (1:00 PM - 4:00 PM)',
  'Late Afternoon (4:00 PM - 6:00 PM)',
];

export const CreateRepairRequestScreen: React.FC<CreateRepairRequestScreenProps> = ({
  provider,
  item = DEFAULT_ITEM,
  onNavigateBack,
  onRequestSubmitted,
}) => {
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
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <View style={styles.topSpacer} />
          <Text style={styles.topTitle}>Request Submitted</Text>
          <View style={styles.topSpacer} />
        </View>
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
              <StatusBadge status="REQUESTED" />
            </View>
          </Card>

          <Text style={styles.nextStepNotice}>
            The provider will review your request and submit a formal price quotation shortly.
          </Text>

          <PrimaryButton
            title="View Request & Status"
            onPress={() => onRequestSubmitted?.(submittedRequest)}
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
          Request Repair
        </Text>
        <View style={styles.topSpacer} />
      </View>

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
                {item.condition && <StatusBadge status={item.condition} />}
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
                  {provider.isVerified && <StatusBadge status="VERIFIED" />}
                </View>
                <Text style={styles.providerLocation}>
                  📍 {typeof provider.location === 'object' ? provider.location?.city : (provider.location || 'Colombo')}
                </Text>
                <Text style={styles.providerRating}>
                  ★ {(provider.ratingAverage ?? provider.rating ?? 5.0).toFixed(1)} ({provider.ratingCount ?? provider.reviewCount ?? 0} reviews)
                </Text>
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
            placeholder="e.g. Battery drains rapidly within 30 minutes, laptop overheats, fans run full speed..."
            placeholderTextColor={COLORS.textMuted}
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
            placeholderTextColor={COLORS.textMuted}
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

          <Text style={[styles.sectionLabel, { marginTop: SPACING.md }]}>Preferred Time Window</Text>
          <View style={styles.timeSlotsContainer}>
            {TIME_SLOTS.map((slot) => {
              const isSelected = preferredTime === slot;
              return (
                <Pressable
                  key={slot}
                  style={[styles.timeSlotOption, isSelected && styles.selectedTimeSlot]}
                  onPress={() => setPreferredTime(slot)}
                >
                  <Text style={[styles.timeSlotText, isSelected && styles.selectedTimeSlotText]}>
                    {slot}
                  </Text>
                </Pressable>
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
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={2}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Global Error Banner */}
        {errorMessage ? (
          <View style={{ marginBottom: SPACING.md }}>
            <MessageBanner message={errorMessage} />
          </View>
        ) : null}

        {/* Submit Action */}
        <PrimaryButton
          title="Submit Repair Request"
          onPress={handleSubmit}
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
  section: {
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  fieldHint: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  itemCard: {
    padding: SPACING.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.md,
    marginRight: SPACING.md,
  },
  itemImageFallback: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: COLORS.text,
  },
  itemCategory: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 4,
  },
  providerCard: {
    padding: SPACING.sm,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  providerAvatarText: {
    fontSize: FONT.md,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  providerDetails: {
    flex: 1,
  },
  providerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  providerBusinessName: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: COLORS.text,
  },
  providerLocation: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  providerRating: {
    fontSize: FONT.xs,
    color: COLORS.text,
    marginTop: 2,
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
  textArea: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    fontSize: FONT.sm,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT.xs,
    marginTop: 4,
  },
  timeSlotsContainer: {
    gap: SPACING.xs,
  },
  timeSlotOption: {
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedTimeSlot: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  timeSlotText: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  selectedTimeSlotText: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  successContainer: {
    alignItems: 'center',
    padding: SPACING.lg,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  successCheck: {
    fontSize: 32,
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  successTitle: {
    fontSize: FONT.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  successSubtitle: {
    fontSize: FONT.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  boldText: {
    fontWeight: '700',
    color: COLORS.text,
  },
  summaryCard: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  summaryHeading: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.xs,
  },
  summaryRow: {
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
  nextStepNotice: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
});
