import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';

interface RatingStarsProps {
  rating: number; // 0 to 5
  onRatingChange?: (rating: number) => void;
  size?: number;
  readOnly?: boolean;
  showLabel?: boolean;
  style?: ViewStyle;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Terrible',
  2: 'Poor',
  3: 'Average',
  4: 'Good',
  5: 'Excellent',
};

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  onRatingChange,
  size = 32,
  readOnly = false,
  showLabel = false,
  style,
}) => {
  const stars = [1, 2, 3, 4, 5];

  const handlePress = (selectedStar: number) => {
    if (!readOnly && onRatingChange) {
      onRatingChange(selectedStar);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.starsRow}>
        {stars.map((star) => {
          const isFilled = star <= rating;
          return (
            <TouchableOpacity
              key={star}
              activeOpacity={readOnly ? 1 : 0.7}
              onPress={() => handlePress(star)}
              disabled={readOnly}
              style={[
                styles.starButton,
                { paddingHorizontal: size > 24 ? 6 : 2 },
              ]}
              accessibilityLabel={`${star} Star`}
            >
              <Text
                style={[
                  styles.starText,
                  {
                    fontSize: size,
                    color: isFilled ? '#F59E0B' : '#D1D5DB', // Amber vs light grey
                  },
                ]}
              >
                ★
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {showLabel && rating > 0 && (
        <Text style={styles.label}>{RATING_LABELS[rating] || ''}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 6,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  starText: {
    textAlign: 'center',
    lineHeight: 40,
  },
  label: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
  },
});
