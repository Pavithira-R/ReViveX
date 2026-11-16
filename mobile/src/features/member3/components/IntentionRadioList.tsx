// ============================================================================
// Member 3 - IntentionRadioList Component
// Intent choice list for user desire (Step 4)
// ============================================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { UserIntention } from '../types';
import { INTENTION_META, COLORS, RADIUS, SPACING } from '../constants/theme';

interface IntentionRadioListProps {
  selectedIntention: UserIntention | null;
  onSelectIntention: (intention: UserIntention) => void;
}

const INTENTIONS: UserIntention[] = [
  'KEEP_USE',
  'REPAIR',
  'SELL',
  'GIVE_AWAY',
  'DISPOSE_RESPONSIBLY',
];

export const IntentionRadioList: React.FC<IntentionRadioListProps> = ({
  selectedIntention,
  onSelectIntention,
}) => {
  return (
    <View style={styles.container}>
      {INTENTIONS.map((intent) => {
        const meta = INTENTION_META[intent];
        const isSelected = selectedIntention === intent;

        return (
          <TouchableOpacity
            key={intent}
            style={[styles.rowCard, isSelected && styles.rowCardSelected]}
            onPress={() => onSelectIntention(intent)}
            activeOpacity={0.7}
          >
            <Text style={styles.icon}>{meta.icon}</Text>

            <View style={styles.content}>
              <Text style={[styles.title, isSelected && styles.titleSelected]}>
                {meta.label}
              </Text>
              <Text style={styles.description}>{meta.description}</Text>
            </View>

            <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
              {isSelected && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  rowCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  icon: {
    fontSize: 26,
    marginRight: SPACING.md,
  },
  content: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  titleSelected: {
    color: COLORS.primaryDark,
  },
  description: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
});
