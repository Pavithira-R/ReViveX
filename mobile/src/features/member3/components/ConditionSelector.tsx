// ============================================================================
// Member 3 - ConditionSelector Component
// Radio choice list for device working condition (Step 2)
// ============================================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DeviceCondition } from '../types';
import { CONDITION_META, COLORS, RADIUS, SPACING } from '../constants/theme';

interface ConditionSelectorProps {
  selectedCondition: DeviceCondition | null;
  onSelectCondition: (condition: DeviceCondition) => void;
}

const CONDITIONS: DeviceCondition[] = [
  'WORKING_NORMALLY',
  'WORKING_WITH_PROBLEMS',
  'NOT_WORKING',
  'PHYSICALLY_DAMAGED',
];

export const ConditionSelector: React.FC<ConditionSelectorProps> = ({
  selectedCondition,
  onSelectCondition,
}) => {
  return (
    <View style={styles.container}>
      {CONDITIONS.map((cond) => {
        const meta = CONDITION_META[cond];
        const isSelected = selectedCondition === cond;

        return (
          <TouchableOpacity
            key={cond}
            style={[styles.rowCard, isSelected && styles.rowCardSelected]}
            onPress={() => onSelectCondition(cond)}
            activeOpacity={0.7}
          >
            <View style={styles.radioContainer}>
              <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                {isSelected && <View style={styles.radioInner} />}
              </View>
            </View>

            <View style={styles.content}>
              <View style={styles.headerRow}>
                <Text style={[styles.title, isSelected && styles.titleSelected]}>
                  {meta.label}
                </Text>
                <View style={[styles.badge, { backgroundColor: meta.bgColor }]}>
                  <Text style={[styles.badgeText, { color: meta.color }]}>{meta.badge}</Text>
                </View>
              </View>
              <Text style={styles.description}>{meta.description}</Text>
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
  radioContainer: {
    marginRight: SPACING.md,
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
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  titleSelected: {
    color: COLORS.primaryDark,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
});
