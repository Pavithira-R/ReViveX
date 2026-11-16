// ============================================================================
// Member 3 - MultiFacetFilterModal Component
// Multi-Facet Filtering Modal (Category, Condition, Action, Radius, Price, Rating)
// ============================================================================

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
} from 'react-native';
import {
  SearchFilters,
  DeviceCategory,
  DeviceCondition,
  ActionTypeFilter,
} from '../types';
import {
  CATEGORY_META,
  CONDITION_META,
  COLORS,
  RADIUS,
  SHADOWS,
  SPACING,
} from '../constants/theme';

interface MultiFacetFilterModalProps {
  visible: boolean;
  filters: SearchFilters;
  onApply: (filters: SearchFilters) => void;
  onClose: () => void;
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

const CONDITIONS: DeviceCondition[] = [
  'WORKING_NORMALLY',
  'WORKING_WITH_PROBLEMS',
  'NOT_WORKING',
  'PHYSICALLY_DAMAGED',
];

const ACTION_TYPES: ActionTypeFilter[] = [
  'ALL',
  'REPAIR',
  'SELL',
  'DONATE',
  'REUSE',
  'RECYCLE',
];

const RADIUS_OPTIONS: { label: string; value?: number }[] = [
  { label: '2 km', value: 2 },
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '25 km', value: 25 },
  { label: '50 km', value: 50 },
  { label: 'Anywhere', value: undefined },
];

const RATING_OPTIONS: { label: string; value?: number }[] = [
  { label: 'All Ratings', value: undefined },
  { label: '3.0★ & up', value: 3.0 },
  { label: '4.0★ & up', value: 4.0 },
  { label: '4.5★ & up', value: 4.5 },
];

export const MultiFacetFilterModal: React.FC<MultiFacetFilterModalProps> = ({
  visible,
  filters,
  onApply,
  onClose,
}) => {
  const [category, setCategory] = useState<DeviceCategory | undefined>(filters.category);
  const [condition, setCondition] = useState<DeviceCondition | undefined>(filters.condition);
  const [actionType, setActionType] = useState<ActionTypeFilter>(filters.actionType || 'ALL');
  const [radiusKm, setRadiusKm] = useState<number | undefined>(filters.radiusKm);
  const [minPrice, setMinPrice] = useState<string>(
    filters.minPrice !== undefined ? filters.minPrice.toString() : ''
  );
  const [maxPrice, setMaxPrice] = useState<string>(
    filters.maxPrice !== undefined ? filters.maxPrice.toString() : ''
  );
  const [minRating, setMinRating] = useState<number | undefined>(filters.minRating);

  const calculateActiveCount = () => {
    let count = 0;
    if (category) count++;
    if (condition) count++;
    if (actionType && actionType !== 'ALL') count++;
    if (radiusKm !== undefined) count++;
    if (minPrice.trim() || maxPrice.trim()) count++;
    if (minRating !== undefined) count++;
    return count;
  };

  const handleReset = () => {
    setCategory(undefined);
    setCondition(undefined);
    setActionType('ALL');
    setRadiusKm(undefined);
    setMinPrice('');
    setMaxPrice('');
    setMinRating(undefined);
  };

  const handleApply = () => {
    const updated: SearchFilters = {
      ...filters,
      category,
      condition,
      actionType,
      radiusKm,
      minPrice: minPrice.trim() ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice.trim() ? parseFloat(maxPrice) : undefined,
      minRating,
      page: 1, // Reset to first page upon filter change
    };
    onApply(updated);
  };

  const activeCount = calculateActiveCount();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Filter Results</Text>
              <Text style={styles.headerSubtitle}>
                {activeCount > 0 ? `${activeCount} filter(s) active` : 'Refine search parameters'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* 1. Action Type */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Action Type</Text>
              <View style={styles.chipsRow}>
                {ACTION_TYPES.map((act) => {
                  const isSelected = actionType === act;
                  return (
                    <TouchableOpacity
                      key={act}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => setActionType(act)}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {act}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 2. Device Category */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Device Category</Text>
              <View style={styles.chipsRow}>
                <TouchableOpacity
                  style={[styles.chip, !category && styles.chipActive]}
                  onPress={() => setCategory(undefined)}
                >
                  <Text style={[styles.chipText, !category && styles.chipTextActive]}>
                    All Categories
                  </Text>
                </TouchableOpacity>
                {CATEGORIES.map((cat) => {
                  const meta = CATEGORY_META[cat];
                  const isSelected = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => setCategory(isSelected ? undefined : cat)}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {meta.icon} {meta.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 3. Working Condition */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hardware Condition</Text>
              <View style={styles.chipsRow}>
                <TouchableOpacity
                  style={[styles.chip, !condition && styles.chipActive]}
                  onPress={() => setCondition(undefined)}
                >
                  <Text style={[styles.chipText, !condition && styles.chipTextActive]}>
                    Any Condition
                  </Text>
                </TouchableOpacity>
                {CONDITIONS.map((cond) => {
                  const meta = CONDITION_META[cond];
                  const isSelected = condition === cond;
                  return (
                    <TouchableOpacity
                      key={cond}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => setCondition(isSelected ? undefined : cond)}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {meta.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 4. Distance / Radius */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Proximity Radius</Text>
              <View style={styles.chipsRow}>
                {RADIUS_OPTIONS.map((opt) => {
                  const isSelected = radiusKm === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.label}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => setRadiusKm(opt.value)}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        📍 {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 5. Price Range (Visible for Sell / Providers) */}
            {actionType !== 'DONATE' && actionType !== 'RECYCLE' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Price Range ($)</Text>
                <View style={styles.priceRow}>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Min $"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    value={minPrice}
                    onChangeText={setMinPrice}
                  />
                  <Text style={styles.priceTo}>to</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Max $"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                  />
                </View>
              </View>
            )}

            {/* 6. Minimum Provider Rating */}
            {(actionType === 'ALL' || actionType === 'REPAIR') && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Minimum Provider Rating</Text>
                <View style={styles.chipsRow}>
                  {RATING_OPTIONS.map((opt) => {
                    const isSelected = minRating === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.label}
                        style={[styles.chip, isSelected && styles.chipActive]}
                        onPress={() => setMinRating(opt.value)}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleReset} style={styles.resetBtn} activeOpacity={0.7}>
              <Text style={styles.resetText}>Clear All</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleApply} style={styles.applyBtn} activeOpacity={0.85}>
              <Text style={styles.applyText}>
                Apply Filters {activeCount > 0 ? `(${activeCount})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  body: {
    maxHeight: 460,
  },
  bodyContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.lg,
  },
  section: {},
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  chip: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  priceInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 42,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  priceTo: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
  },
  resetBtn: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  resetText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  applyBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  applyText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textInverse,
  },
});
