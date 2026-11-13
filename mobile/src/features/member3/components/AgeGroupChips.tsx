// ============================================================================
// Member 3 - AgeGroupChips Component
// Selectable cards for device age bracket (Step 3)
// ============================================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DeviceAgeGroup } from '../types';
import { AGE_META, COLORS, RADIUS, SPACING } from '../constants/theme';

interface AgeGroupChipsProps {
  selectedAgeGroup: DeviceAgeGroup | null;
  onSelectAgeGroup: (ageGroup: DeviceAgeGroup) => void;
}

const AGE_GROUPS: DeviceAgeGroup[] = [
  'LESS_THAN_1_YEAR',
  'ONE_TO_THREE_YEARS',
  'THREE_TO_FIVE_YEARS',
  'MORE_THAN_5_YEARS',
];

export const AgeGroupChips: React.FC<AgeGroupChipsProps> = ({
  selectedAgeGroup,
  onSelectAgeGroup,
}) => {
  return (
    <View style={styles.container}>
      {AGE_GROUPS.map((age) => {
        const meta = AGE_META[age];
        const isSelected = selectedAgeGroup === age;

        return (
          <TouchableOpacity
            key={age}
            style={[styles.card, isSelected && styles.cardSelected]}
            onPress={() => onSelectAgeGroup(age)}
            activeOpacity={0.7}
          >
            <View style={styles.textContainer}>
              <Text style={[styles.title, isSelected && styles.titleSelected]}>
                {meta.label}
              </Text>
              <Text style={styles.range}>{meta.range}</Text>
            </View>
            <View
              style={[
                styles.checkbox,
                isSelected && styles.checkboxSelected,
              ]}
            >
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  cardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  titleSelected: {
    color: COLORS.primaryDark,
  },
  range: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.textInverse,
    fontSize: 13,
    fontWeight: 'bold',
  },
});
