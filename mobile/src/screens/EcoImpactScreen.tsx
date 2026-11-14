import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageBanner, PrimaryButton } from '../components';
import { COLORS } from '../constants';
import { ecoService } from '../services';
import { EcoActionType, EcoBadge, EcoSummary } from '../types';
import { getErrorMessage } from '../utils';

interface EcoImpactScreenProps {
  onBack: () => void;
}

const ACTION_LABELS: Record<EcoActionType, string> = {
  REPAIR: 'Repaired',
  REUSE: 'Reused',
  SELL: 'Sold',
  DONATE: 'Donated',
  RECYCLE: 'Recycled',
};

const BADGE_LABELS: Record<EcoBadge, string> = {
  NONE: 'No badge yet',
  BRONZE: 'Bronze',
  SILVER: 'Silver',
  GOLD: 'Gold',
};

const BADGE_COLORS: Record<EcoBadge, string> = {
  NONE: COLORS.textMuted,
  BRONZE: '#A0522D',
  SILVER: '#6B7B8C',
  GOLD: '#B8860B',
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

/** "My Eco Impact": points, badge and completed sustainable actions (Member 6). */
export const EcoImpactScreen: React.FC<EcoImpactScreenProps> = ({ onBack }) => {
  const [summary, setSummary] = useState<EcoSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      setSummary(await ecoService.getMine());
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Could not load your eco impact.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const progress = (() => {
    if (!summary?.nextBadge) return 1;
    const earnedTowardsNext = summary.totalPoints;
    return earnedTowardsNext / (earnedTowardsNext + summary.nextBadge.pointsNeeded);
  })();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} accessibilityRole="button" hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.topTitle}>My Eco Impact</Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? <ActivityIndicator color={COLORS.primary} style={styles.loader} /> : null}

        {!isLoading && errorMessage ? (
          <>
            <MessageBanner message={errorMessage} />
            <PrimaryButton title="Try again" variant="outlined" onPress={load} />
          </>
        ) : null}

        {!isLoading && summary ? (
          <>
            <View style={styles.card}>
              <Text style={styles.points}>{summary.totalPoints}</Text>
              <Text style={styles.pointsLabel}>eco points</Text>
              <Text style={[styles.badge, { color: BADGE_COLORS[summary.badge] }]}>
                {BADGE_LABELS[summary.badge]}
              </Text>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
              </View>
              <Text style={styles.meta}>
                {summary.nextBadge
                  ? `${summary.nextBadge.pointsNeeded} points to ${BADGE_LABELS[summary.nextBadge.badge]}`
                  : 'Top badge reached. Thank you!'}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Devices given another life</Text>
            <View style={styles.card}>
              {(Object.keys(ACTION_LABELS) as EcoActionType[]).map((type) => (
                <View key={type} style={styles.row}>
                  <Text style={styles.rowLabel}>{ACTION_LABELS[type]}</Text>
                  <Text style={styles.rowValue}>{summary.counts[type]}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Recent activity</Text>
            <View style={styles.card}>
              {summary.recent.length === 0 ? (
                <Text style={styles.meta}>
                  Repair, reuse, sell, donate or recycle a device to earn your first points.
                </Text>
              ) : (
                summary.recent.map((action) => (
                  <View key={action.id} style={styles.row}>
                    <Text style={styles.rowLabel}>
                      {ACTION_LABELS[action.type]} · {formatDate(action.createdAt)}
                    </Text>
                    <Text style={styles.rowPoints}>+{action.points}</Text>
                  </View>
                ))
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  back: { fontSize: 16, color: COLORS.primary, fontWeight: '600', minWidth: 60 },
  topTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  topSpacer: { minWidth: 60 },
  content: { padding: 20 },
  loader: { marginTop: 40 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    marginBottom: 16,
  },
  points: { fontSize: 44, fontWeight: '800', color: COLORS.primary, textAlign: 'center' },
  pointsLabel: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },
  badge: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primaryLight,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: { height: 8, backgroundColor: COLORS.primary },
  meta: { fontSize: 14, color: COLORS.textMuted, marginTop: 8, lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rowLabel: { fontSize: 15, color: COLORS.text },
  rowValue: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  rowPoints: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
});
