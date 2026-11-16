// ============================================================================
// Member 3 - DiscoveryFeedHero Component
// Hero Banner inviting users into the 60-Second Recommendation Questionnaire
// ============================================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { HeroBannerData } from '../types';
import { RADIUS, SHADOWS, SPACING } from '../constants/theme';

interface DiscoveryFeedHeroProps {
  banner: HeroBannerData;
  onPressStart: () => void;
}

export const DiscoveryFeedHero: React.FC<DiscoveryFeedHeroProps> = ({
  banner,
  onPressStart,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>⚡ {banner.badgeText}</Text>
        </View>
        <Text style={styles.leafIcon}>🌱</Text>
      </View>

      <Text style={styles.title}>{banner.title}</Text>
      <Text style={styles.subtitle}>{banner.subtitle}</Text>

      <TouchableOpacity
        style={styles.ctaButton}
        onPress={onPressStart}
        activeOpacity={0.85}
      >
        <Text style={styles.ctaText}>Start Smart Recommendation Wizard →</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E3A8A', // Deep eco-navy
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.hover,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 0.5,
  },
  leafIcon: {
    fontSize: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 12,
    color: '#BFDBFE',
    lineHeight: 17,
    marginBottom: SPACING.md,
  },
  ctaButton: {
    backgroundColor: '#22C55E', // Vibrant green CTA
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#064E3B',
  },
});
