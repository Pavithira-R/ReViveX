// ============================================================================
// Member 3 - EcoSavingsBanner Component
// Environmental impact visualization card (CO2e savings + Eco Points)
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RADIUS, SHADOWS, SPACING } from '../constants/theme';

interface EcoSavingsBannerProps {
  co2SavingsKg: number;
  ecoPoints: number;
}

export const EcoSavingsBanner: React.FC<EcoSavingsBannerProps> = ({
  co2SavingsKg,
  ecoPoints,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.earthIcon}>🌍</Text>
        <View style={styles.headerText}>
          <Text style={styles.title}>Your Projected Environmental Impact</Text>
          <Text style={styles.subtitle}>
            By choosing circular lifecycle management over raw disposal
          </Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        {/* Metric 1: CO2 Avoided */}
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>~{co2SavingsKg} kg</Text>
          <Text style={styles.metricLabel}>CO₂e Avoided</Text>
          <Text style={styles.metricHint}>Equivalent to ~350 km car drive</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Metric 2: Platform Eco Points */}
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, styles.pointsValue]}>+{ecoPoints}</Text>
          <Text style={styles.metricLabel}>Eco Points Earned</Text>
          <Text style={styles.metricHint}>Redeemable for repair discounts</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#064E3B', // Deep forest green
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  earthIcon: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ECFDF5',
  },
  subtitle: {
    fontSize: 11,
    color: '#A7F3D0',
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#34D399',
  },
  pointsValue: {
    color: '#FDE047',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  metricHint: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: SPACING.sm,
  },
});
