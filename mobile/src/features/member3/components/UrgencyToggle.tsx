// ============================================================================
// Member 3 - UrgencyToggle Component
// Urgency preference chip selector (Optional Step 4 contextual modifier)
// ============================================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ResolutionUrgency } from '../types';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

interface UrgencyToggleProps {
  urgency: ResolutionUrgency;
  onChangeUrgency: (urgency: ResolutionUrgency) => void;
}

export const UrgencyToggle: React.FC<UrgencyToggleProps> = ({
  urgency,
  onChangeUrgency,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Resolution Urgency (Optional)</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.chip, urgency === 'FLEXIBLE' && styles.chipActive]}
          onPress={() => onChangeUrgency('FLEXIBLE')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.chipText,
              urgency === 'FLEXIBLE' && styles.chipTextActive,
            ]}
          >
            🌱 Flexible (Standard)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, urgency === 'URGENT' && styles.chipActiveUrgent]}
          onPress={() => onChangeUrgency('URGENT')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.chipText,
              urgency === 'URGENT' && styles.chipTextActiveUrgent,
            ]}
          >
            ⚡ Urgent (Priority)
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.md,
  },
  header: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  chip: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  chipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  chipActiveUrgent: {
    borderColor: COLORS.warning,
    backgroundColor: '#FEF3C7',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.primaryDark,
  },
  chipTextActiveUrgent: {
    color: '#92400E',
  },
});
