// ============================================================================
// Member 3 - SectionHeader Component
// Standard section title with subtitle and optional "See All" action
// ============================================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  onPressSeeAll?: () => void;
  seeAllLabel?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  onPressSeeAll,
  seeAllLabel = 'See All',
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {onPressSeeAll && (
        <TouchableOpacity onPress={onPressSeeAll} activeOpacity={0.7} style={styles.seeAllBtn}>
          <Text style={styles.seeAllText}>{seeAllLabel} →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  seeAllBtn: {
    paddingVertical: 2,
    paddingLeft: SPACING.sm,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
