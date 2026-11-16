// Member 6 – Ratings and reviews. Based on Sasini Siriwardhana's RatingStars component.
import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

interface RatingStarsProps {
  /** 0–5; 0 means nothing chosen yet. */
  rating: number;
  /** Leave out to show the stars read-only. */
  onRatingChange?: (rating: number) => void;
  size?: number;
  showLabel?: boolean;
  style?: ViewStyle;
}

export const RATING_LABELS: Record<number, string> = {
  1: 'Terrible',
  2: 'Poor',
  3: 'Average',
  4: 'Good',
  5: 'Excellent',
};

const FILLED = '#F59E0B';
const EMPTY = '#D1D5DB';

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  onRatingChange,
  size = 32,
  showLabel = false,
  style,
}) => {
  const readOnly = !onRatingChange;
  const rounded = Math.round(rating);

  return (
    <View
      style={[styles.container, style]}
      accessible={readOnly}
      accessibilityLabel={readOnly ? `Rated ${rating} out of 5` : undefined}
    >
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map((star) =>
          readOnly ? (
            <Text key={star} style={[styles.star, { fontSize: size, color: star <= rounded ? FILLED : EMPTY }]}>
              ★
            </Text>
          ) : (
            <Pressable
              key={star}
              onPress={() => onRatingChange(star)}
              accessibilityRole="button"
              accessibilityLabel={`${star} star${star === 1 ? '' : 's'}`}
              accessibilityState={{ selected: star === rounded }}
              hitSlop={4}
              style={styles.starButton}
            >
              <Text style={[styles.star, { fontSize: size, color: star <= rounded ? FILLED : EMPTY }]}>★</Text>
            </Pressable>
          )
        )}
      </View>
      {showLabel && rounded > 0 ? <Text style={styles.label}>{RATING_LABELS[rounded]}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  starButton: { paddingHorizontal: 4 },
  star: { textAlign: 'center' },
  label: { marginTop: 6, fontSize: 14, fontWeight: '600', color: '#D97706' },
});
