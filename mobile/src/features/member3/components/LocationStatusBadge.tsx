// ============================================================================
// Member 3 - LocationStatusBadge Component
// Interactive header pill displaying active city and location source
// ============================================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { UserLocationState } from '../types';
import { formatLocationSourceLabel } from '../utils/location';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

interface LocationStatusBadgeProps {
  location: UserLocationState;
  onPressChange: () => void;
  style?: any;
}

export const LocationStatusBadge: React.FC<LocationStatusBadgeProps> = ({
  location,
  onPressChange,
  style,
}) => {
  const isGps = location.source === 'GPS';
  const isProfile = location.source === 'PROFILE';

  const badgeBg = isGps
    ? COLORS.primaryLight
    : isProfile
    ? COLORS.donateLight
    : COLORS.chipBg;

  const badgeTextColor = isGps
    ? COLORS.primary
    : isProfile
    ? COLORS.donatePurple
    : COLORS.textSecondary;

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPressChange}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Current location: ${location.cityName}, source: ${location.source}. Tap to change.`}
    >
      <View style={styles.contentRow}>
        <Text style={styles.pinIcon}>📍</Text>
        <Text style={styles.cityText} numberOfLines={1}>
          {location.cityName}
        </Text>
        <View style={[styles.sourcePill, { backgroundColor: badgeBg }]}>
          <Text style={[styles.sourceText, { color: badgeTextColor }]}>
            {formatLocationSourceLabel(location.source)}
          </Text>
        </View>
      </View>
      <Text style={styles.changeActionText}>Change</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.sm,
  },
  pinIcon: {
    fontSize: 16,
    marginRight: SPACING.xs,
  },
  cityText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginRight: SPACING.sm,
  },
  sourcePill: {
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  sourceText: {
    fontSize: 11,
    fontWeight: '600',
  },
  changeActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
