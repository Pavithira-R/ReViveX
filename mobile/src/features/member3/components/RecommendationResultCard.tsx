// ============================================================================
// Member 3 - RecommendationResultCard Component
// Outcome card showing primary action, rationale bullets, and alternative path
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RecommendationResult } from '../types';
import { ACTION_THEMES, COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

interface RecommendationResultCardProps {
  result: RecommendationResult;
}

export const RecommendationResultCard: React.FC<RecommendationResultCardProps> = ({
  result,
}) => {
  const theme = ACTION_THEMES[result.primaryAction];
  const altTheme = result.secondaryAction ? ACTION_THEMES[result.secondaryAction] : null;

  return (
    <View style={styles.card}>
      {/* Primary Badge Header */}
      <View style={[styles.badgeBanner, { backgroundColor: theme.bgColor }]}>
        <Text style={styles.badgeIcon}>{theme.icon}</Text>
        <View style={styles.badgeTextContainer}>
          <Text style={[styles.badgeAction, { color: theme.textColor }]}>
            RECOMMENDED: {result.primaryAction}
          </Text>
          <Text style={styles.ruleText}>Validated by {result.ruleTriggered}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{result.title}</Text>

        {/* Rationale List */}
        <View style={styles.rationaleContainer}>
          <Text style={styles.sectionSubtitle}>Why this was recommended:</Text>
          {result.rationale.map((point, index) => (
            <View key={index} style={styles.rationaleRow}>
              <Text style={styles.bulletCheck}>✓</Text>
              <Text style={styles.rationaleText}>{point}</Text>
            </View>
          ))}
        </View>

        {/* Secondary Alternative Action */}
        {result.secondaryAction && altTheme && (
          <View style={styles.alternativeBox}>
            <Text style={styles.alternativeLabel}>Alternative Option:</Text>
            <View style={[styles.altChip, { backgroundColor: altTheme.bgColor }]}>
              <Text style={styles.altIcon}>{altTheme.icon}</Text>
              <Text style={[styles.altText, { color: altTheme.textColor }]}>
                {result.secondaryAction}: {altTheme.title}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.card,
    marginBottom: SPACING.lg,
  },
  badgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  badgeIcon: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  badgeTextContainer: {
    flex: 1,
  },
  badgeAction: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ruleText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  body: {
    padding: SPACING.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 26,
    marginBottom: SPACING.md,
  },
  rationaleContainer: {
    marginBottom: SPACING.md,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  rationaleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  bulletCheck: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: SPACING.sm,
    marginTop: 1,
  },
  rationaleText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  alternativeBox: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  alternativeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  altChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  altIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  altText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
