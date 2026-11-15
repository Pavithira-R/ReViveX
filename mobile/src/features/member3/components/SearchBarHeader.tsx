// ============================================================================
// Member 3 - SearchBarHeader Component
// Search bar header with clear button, filter button, and back button
// ============================================================================

import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

interface SearchBarHeaderProps {
  value: string;
  onChangeText?: (text: string) => void;
  onSubmitEditing?: () => void;
  onClear?: () => void;
  onPressFilter?: () => void;
  onPressBack?: () => void;
  onPressSearchBar?: () => void;
  isReadOnly?: boolean;
  placeholder?: string;
  activeFilterCount?: number;
  autoFocus?: boolean;
}

export const SearchBarHeader: React.FC<SearchBarHeaderProps> = ({
  value,
  onChangeText,
  onSubmitEditing,
  onClear,
  onPressFilter,
  onPressBack,
  onPressSearchBar,
  isReadOnly = false,
  placeholder = 'Search devices, repair, listings...',
  activeFilterCount = 0,
  autoFocus = false,
}) => {
  return (
    <View style={styles.container}>
      {/* Optional Back Button */}
      {onPressBack && (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onPressBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      )}

      {/* Input or Touchable Trigger */}
      <TouchableOpacity
        style={styles.inputWrapper}
        activeOpacity={isReadOnly ? 0.8 : 1}
        onPress={isReadOnly ? onPressSearchBar : undefined}
      >
        <Text style={styles.searchIcon}>🔍</Text>

        {isReadOnly ? (
          <Text
            style={[styles.inputPlaceholder, !!value && styles.inputText]}
            numberOfLines={1}
          >
            {value || placeholder}
          </Text>
        ) : (
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={COLORS.textMuted}
            returnKeyType="search"
            onSubmitEditing={onSubmitEditing}
            autoFocus={autoFocus}
          />
        )}

        {/* Clear Button */}
        {!isReadOnly && value.length > 0 && onClear && (
          <TouchableOpacity
            onPress={onClear}
            style={styles.clearButton}
            activeOpacity={0.7}
          >
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Filter Button */}
      {onPressFilter && (
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilterCount > 0 && styles.filterButtonActive,
          ]}
          onPress={onPressFilter}
          activeOpacity={0.7}
        >
          <Text style={styles.filterIcon}>⚙️</Text>
          {activeFilterCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceAlt,
  },
  backIcon: {
    fontSize: 20,
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  inputPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  inputText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  clearButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.xs,
  },
  clearIcon: {
    fontSize: 12,
    color: COLORS.textInverse,
    fontWeight: 'bold',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  filterIcon: {
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textInverse,
  },
});
