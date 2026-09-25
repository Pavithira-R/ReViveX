import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { ReviewCard } from '../components/ReviewCard';
import { RatingStars } from '../components/RatingStars';
import { Card } from '../components/common/Card';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { reviewService } from '../services/reviewService';
import { ProviderReviewsSummary } from '../types/review';

interface ReviewListScreenProps {
  providerId?: string;
  providerName?: string;
  onNavigateToWriteReview?: () => void;
}

export const ReviewListScreen: React.FC<ReviewListScreenProps> = ({
  providerId = 'prov-tech-1',
  providerName = 'Lanka Electro Fix Solutions',
}) => {
  const [data, setData] = useState<ProviderReviewsSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = async () => {
    try {
      setError(null);
      const result = await reviewService.fetchProviderReviews(providerId);
      setData(result);
    } catch (err: any) {
      setError(err?.message || 'Failed to load reviews');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [providerId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadReviews();
  };

  // Header displaying average rating & breakdown
  const renderHeader = () => {
    if (!data || data.totalReviews === 0) return null;

    return (
      <Card style={styles.summaryCard}>
        <View style={styles.summaryLeft}>
          <Text style={styles.avgRatingNumber}>{data.averageRating.toFixed(1)}</Text>
          <RatingStars rating={Math.round(data.averageRating)} size={18} readOnly />
          <Text style={styles.totalReviewsCount}>
            Based on {data.totalReviews} {data.totalReviews === 1 ? 'review' : 'reviews'}
          </Text>
        </View>

        <View style={styles.summaryRight}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = data.ratingBreakdown[star as 1 | 2 | 3 | 4 | 5] || 0;
            const percentage = data.totalReviews > 0 ? (count / data.totalReviews) * 100 : 0;
            return (
              <View key={star} style={styles.breakdownRow}>
                <Text style={styles.starNumLabel}>{star}★</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${percentage}%` }]} />
                </View>
                <Text style={styles.countText}>{count}</Text>
              </View>
            );
          })}
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Customer Reviews</Text>
        <Text style={styles.providerSubtitle}>{providerName}</Text>
      </View>

      {isLoading ? (
        <LoadingState message="Loading community reviews..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadReviews} />
      ) : (
        <FlatList
          data={data?.reviews || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ReviewCard review={item} />}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <EmptyState
              title="No Reviews Yet"
              description={`There are currently no reviews for ${providerName}. Have you used their repair services? Be the first to leave a review!`}
            />
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#059669']}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  screenHeader: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  providerSubtitle: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  summaryLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    minWidth: 110,
  },
  avgRatingNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1F2937',
  },
  totalReviewsCount: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  summaryRight: {
    flex: 1,
    paddingLeft: 14,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  starNumLabel: {
    width: 22,
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  countText: {
    width: 18,
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'right',
  },
});
