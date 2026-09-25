import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Review } from '../types/review';
import { RatingStars } from './RatingStars';
import { Card } from './common/Card';

interface ReviewCardProps {
  review: Review;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const formattedDate = new Date(review.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const reviewerInitial = review.reviewerName
    ? review.reviewerName.charAt(0).toUpperCase()
    : 'U';

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.reviewerInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{reviewerInitial}</Text>
          </View>
          <View>
            <Text style={styles.reviewerName}>
              {review.reviewerName || 'ReViveX User'}
            </Text>
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
        </View>
        <RatingStars rating={review.rating} size={18} readOnly />
      </View>

      {review.comment ? (
        <Text style={styles.comment}>{review.comment}</Text>
      ) : (
        <Text style={styles.emptyComment}>Rated without written review</Text>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 6,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#0284C7',
    fontWeight: '700',
    fontSize: 16,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
  },
  comment: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  emptyComment: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});
