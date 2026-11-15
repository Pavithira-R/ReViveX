import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { RepairRequest } from '../types';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../../theme';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

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
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Action Selector Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, action === 'ACCEPT' && styles.activeAcceptTab]}
              onPress={() => setAction('ACCEPT')}
            >
              <Text style={[styles.tabText, action === 'ACCEPT' && styles.activeAcceptText]}>
                ✓ Accept & Quote Price
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, action === 'REJECT' && styles.activeRejectTab]}
              onPress={() => setAction('REJECT')}
            >
              <Text style={[styles.tabText, action === 'REJECT' && styles.activeRejectText]}>
                ✕ Decline Request
              </Text>
            </TouchableOpacity>
          </View>

          {action === 'ACCEPT' ? (
            <View style={styles.bodySection}>
              <Text style={styles.label}>Estimated Repair Price (USD) *</Text>
              <View style={styles.priceInputWrapper}>
                <Text style={styles.currencyPrefix}>$</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={estimatedPrice}
                  onChangeText={setEstimatedPrice}
                />
              </View>

              <Text style={[styles.label, { marginTop: Spacing.md }]}>
                Provider Notes & Warranty Details
              </Text>
              <TextInput
                style={styles.textArea}
                placeholder="Details on diagnostic findings, replacement parts, turnaround time..."
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
            <Button
              title="Cancel"
              variant="outline"
              size="md"
              onPress={onClose}
              style={styles.cancelBtn}
            />
            <Button
              title={action === 'ACCEPT' ? 'Send Quotation' : 'Confirm Decline'}
              variant={action === 'ACCEPT' ? 'primary' : 'danger'}
              size="md"
              loading={isSubmitting}
              onPress={handleSubmit}
              style={styles.submitBtn}
            />
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
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  closeText: {
    fontSize: Typography.fontSizes.md,
    color: Colors.textMuted,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeAcceptTab: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  activeRejectTab: {
    backgroundColor: Colors.dangerLight,
    borderColor: Colors.danger,
  },
  tabText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.textSecondary,
  },
  activeAcceptText: {
    color: Colors.primaryDark,
  },
  activeRejectText: {
    color: Colors.danger,
  },
  bodySection: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  currencyPrefix: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.primary,
    marginRight: Spacing.xs,
  },
  priceInput: {
    flex: 1,
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
  },
  textArea: {
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSizes.sm,
    color: Colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.danger,
    marginBottom: Spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
  },
  submitBtn: {
    flex: 2,
  },
});
