// Member 6 – Ratings and reviews. Based on Sasini Siriwardhana's ReviewCard component.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants';
import { Review } from '../types';
import { RatingStars } from './RatingStars';

const REF_LABELS: Record<Review['refType'], string> = {
  REPAIR: 'Repair',
  LISTING: 'Reuse / sale / donation',
  RECYCLING: 'Recycling pickup',
};

export const ReviewCard: React.FC<{ review: Review }> = ({ review }) => {
  const date = new Date(review.createdAt).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.reviewer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(review.reviewerName || 'U').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.name}>{review.reviewerName || 'ReViveX user'}</Text>
            <Text style={styles.meta}>
              {REF_LABELS[review.refType]} · {date}
            </Text>
          </View>
        </View>
        <RatingStars rating={review.rating} size={16} />
      </View>
      {review.comment ? (
        <Text style={styles.comment}>{review.comment}</Text>
      ) : (
        <Text style={styles.noComment}>Rated without a written review</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginTop: 12,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  reviewer: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  flex: { flex: 1 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: { color: COLORS.primary, fontWeight: '700', fontSize: 16 },
  name: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  meta: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  comment: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  noComment: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic' },
});
