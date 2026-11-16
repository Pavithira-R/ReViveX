// Member 6 – Reviews a user has received (average, star breakdown, list)
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageBanner, OfflineBanner, PrimaryButton, RatingStars, ReviewCard } from '../components';
import { COLORS } from '../constants';
import { reviewService, withOfflineCache } from '../services';
import { ReviewSummary } from '../types';
import { getErrorMessage } from '../utils';

interface ReviewsScreenProps {
  userId: string;
  /** Shown in the title, e.g. "Kasun Repairs". Leave out for "My reviews". */
  userName?: string;
  onBack: () => void;
}

export const ReviewsScreen: React.FC<ReviewsScreenProps> = ({ userId, userName, onBack }) => {
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [offlineSince, setOfflineSince] = useState<string | null>(null);

  const load = useCallback(
    async (refreshing = false) => {
      if (refreshing) setIsRefreshing(true);
      else setIsLoading(true);
      setErrorMessage(null);
      try {
        const result = await withOfflineCache(`reviews.${userId}`, () => reviewService.listFor(userId));
        setSummary(result.data);
        setOfflineSince(result.fromCache ? result.savedAt : null);
      } catch (error) {
        setErrorMessage(getErrorMessage(error, 'Could not load reviews.'));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    load();
  }, [load]);

  const title = userName ? `Reviews of ${userName}` : 'My reviews';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} accessibilityRole="button" hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} />}
      >
        {isLoading ? <ActivityIndicator color={COLORS.primary} style={styles.loader} /> : null}
        <OfflineBanner savedAt={offlineSince} />
        <MessageBanner message={errorMessage} />
        {!isLoading && errorMessage && !summary ? (
          <PrimaryButton title="Try again" variant="outlined" onPress={() => load()} />
        ) : null}

        {summary && summary.totalReviews === 0 ? (
          <Text style={styles.empty}>No reviews yet. Reviews appear here after completed repairs, listings and pickups.</Text>
        ) : null}

        {summary && summary.totalReviews > 0 ? (
          <>
            <View style={styles.summary}>
              <Text style={styles.average}>{summary.averageRating.toFixed(1)}</Text>
              <RatingStars rating={summary.averageRating} size={22} />
              <Text style={styles.count}>
                {summary.totalReviews} review{summary.totalReviews === 1 ? '' : 's'}
              </Text>
              {([5, 4, 3, 2, 1] as const).map((star) => (
                <View key={star} style={styles.barRow}>
                  <Text style={styles.barLabel}>{star} ★</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[styles.barFill, { flex: summary.breakdown[star] / summary.totalReviews }]}
                    />
                    <View style={{ flex: 1 - summary.breakdown[star] / summary.totalReviews }} />
                  </View>
                  <Text style={styles.barCount}>{summary.breakdown[star]}</Text>
                </View>
              ))}
            </View>
            {summary.reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
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
  topTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, flexShrink: 1 },
  topSpacer: { minWidth: 60 },
  content: { padding: 20 },
  loader: { marginTop: 40 },
  empty: { fontSize: 15, color: COLORS.textMuted, textAlign: 'center', marginTop: 40, lineHeight: 22 },
  summary: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    alignItems: 'center',
  },
  average: { fontSize: 40, fontWeight: '800', color: COLORS.text },
  count: { fontSize: 13, color: COLORS.textMuted, marginTop: 4, marginBottom: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', marginTop: 4 },
  barLabel: { width: 36, fontSize: 13, color: COLORS.text },
  barTrack: { flex: 1, flexDirection: 'row', height: 8, borderRadius: 4, backgroundColor: COLORS.border, overflow: 'hidden' },
  barFill: { backgroundColor: '#F59E0B' },
  barCount: { width: 28, textAlign: 'right', fontSize: 13, color: COLORS.textMuted },
});
