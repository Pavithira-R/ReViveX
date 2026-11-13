// ============================================================================
// Member 3 - CategoryGrid Component
// Visual choice grid for selecting device category (Step 1)
// ============================================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DeviceCategory } from '../types';
import { CATEGORY_META, COLORS, RADIUS, SPACING } from '../constants/theme';

interface CategoryGridProps {
  selectedCategory: DeviceCategory | null;
  onSelectCategory: (category: DeviceCategory) => void;
}

const CATEGORIES: DeviceCategory[] = [
  'LAPTOP',
  'PHONE',
  'TABLET',
  'DESKTOP',
  'MONITOR',
  'PRINTER',
  'OTHER',
];

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <View style={styles.grid}>
      {CATEGORIES.map((cat) => {
        const meta = CATEGORY_META[cat];
        const isSelected = selectedCategory === cat;

        return (
          <TouchableOpacity
            key={cat}
            style={[styles.card, isSelected && styles.cardSelected]}
            onPress={() => onSelectCategory(cat)}
            activeOpacity={0.7}
          >
            <Text style={styles.icon}>{meta.icon}</Text>
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {meta.label}
            </Text>
            <Text style={styles.description} numberOfLines={1}>
              {meta.description}
            </Text>
            {isSelected && <View style={styles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  card: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
    position: 'relative',
    minHeight: 104,
    justifyContent: 'center',
  },
  cardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  icon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  labelSelected: {
    color: COLORS.primaryDark,
  },
  description: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  activeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
});
