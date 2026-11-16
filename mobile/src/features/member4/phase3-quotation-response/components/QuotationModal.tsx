import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { RepairRequest } from '../types';
import { PrimaryButton } from '../../../../components';
import { COLORS, FONT, RADIUS, SHADOW, SPACING } from '../../../../constants';

interface QuotationModalProps {
  visible: boolean;
  request: RepairRequest | null;
  onClose: () => void;
  onSubmit: (response: {
    action: 'ACCEPT' | 'REJECT';
    estimatedPrice?: number;
    providerNotes?: string;
    rejectionReason?: string;
  }) => Promise<void>;
}

export const QuotationModal: React.FC<QuotationModalProps> = ({
  visible,
  request,
  onClose,
  onSubmit,
}) => {
  const [action, setAction] = useState<'ACCEPT' | 'REJECT'>('ACCEPT');
  const [estimatedPrice, setEstimatedPrice] = useState<string>('65');
  const [providerNotes, setProviderNotes] = useState<string>('Includes replacement OEM battery and 90-day warranty.');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!request) return null;

  const handleSubmit = async () => {
    setError(null);

    if (action === 'ACCEPT') {
      const priceNum = parseFloat(estimatedPrice);
      if (isNaN(priceNum) || priceNum < 0) {
        setError('Please enter a valid non-negative quotation price.');
        return;
      }
      setIsSubmitting(true);
      try {
        await onSubmit({
          action: 'ACCEPT',
          estimatedPrice: priceNum,
          providerNotes: providerNotes.trim() ? providerNotes : undefined,
        });
        onClose();
      } catch (err: any) {
        setError(err.message || 'Failed to submit acceptance');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
        setError('Please provide a reason for rejection (at least 5 characters).');
        return;
      }
      setIsSubmitting(true);
      try {
        await onSubmit({
          action: 'REJECT',
          rejectionReason: rejectionReason.trim(),
          providerNotes: providerNotes.trim() ? providerNotes : undefined,
        });
        onClose();
      } catch (err: any) {
        setError(err.message || 'Failed to submit rejection');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Respond to Repair Request</Text>
              <Text style={styles.modalSubtitle}>Device: {request.itemSummary?.title || 'Electronic Device'}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {/* Action Selector Tabs */}
          <View style={styles.tabContainer}>
            <Pressable
              style={[styles.tab, action === 'ACCEPT' && styles.activeAcceptTab]}
              onPress={() => setAction('ACCEPT')}
            >
              <Text style={[styles.tabText, action === 'ACCEPT' && styles.activeAcceptText]}>
                ✓ Accept & Quote Price
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tab, action === 'REJECT' && styles.activeRejectTab]}
              onPress={() => setAction('REJECT')}
            >
              <Text style={[styles.tabText, action === 'REJECT' && styles.activeRejectText]}>
                ✕ Decline Request
              </Text>
            </Pressable>
          </View>

          {action === 'ACCEPT' ? (
            <View style={styles.bodySection}>
              <Text style={styles.label}>Estimated Repair Price (USD) *</Text>
              <View style={styles.priceInputWrapper}>
                <Text style={styles.currencyPrefix}>$</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="decimal-pad"
                  value={estimatedPrice}
                  onChangeText={setEstimatedPrice}
                />
              </View>

              <Text style={[styles.label, { marginTop: SPACING.md }]}>
                Provider Notes & Warranty Details
              </Text>
              <TextInput
                style={styles.textArea}
                placeholder="Details on diagnostic findings, replacement parts, turnaround time..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={3}
                value={providerNotes}
                onChangeText={setProviderNotes}
              />
            </View>
          ) : (
            <View style={styles.bodySection}>
              <Text style={styles.label}>Reason for Declining *</Text>
              <TextInput
                style={styles.textArea}
                placeholder="e.g. Lack of OEM replacement parts in stock, outside service scope..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={3}
                value={rejectionReason}
                onChangeText={setRejectionReason}
              />
            </View>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Action Buttons */}
          <View style={styles.footerRow}>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                title="Cancel"
                variant="outlined"
                onPress={onClose}
              />
            </View>
            <View style={{ flex: 2 }}>
              <PrimaryButton
                title={action === 'ACCEPT' ? 'Send Quotation' : 'Confirm Decline'}
                variant={action === 'ACCEPT' ? 'filled' : 'danger'}
                loading={isSubmitting}
                onPress={handleSubmit}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOW.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: FONT.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  closeText: {
    fontSize: FONT.md,
    color: COLORS.textMuted,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeAcceptTab: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  activeRejectTab: {
    backgroundColor: COLORS.dangerLight,
    borderColor: COLORS.danger,
  },
  tabText: {
    fontSize: FONT.xs,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeAcceptText: {
    color: COLORS.primaryDark,
  },
  activeRejectText: {
    color: COLORS.danger,
  },
  bodySection: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
  },
  currencyPrefix: {
    fontSize: FONT.lg,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: SPACING.xs,
  },
  priceInput: {
    flex: 1,
    fontSize: FONT.lg,
    fontWeight: '700',
    color: COLORS.text,
    paddingVertical: SPACING.sm,
  },
  textArea: {
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT.sm,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: FONT.xs,
    color: COLORS.error,
    marginBottom: SPACING.sm,
  },
  footerRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
});
