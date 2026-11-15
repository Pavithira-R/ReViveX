// Member 6 – Leave a review after a completed repair, listing or recycling pickup
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormInput, MessageBanner, PrimaryButton, RatingStars } from '../components';
import { COLORS } from '../constants';
import { REVIEW_COMMENT_MAX, reviewService } from '../services';
import { ReviewRefType } from '../types';
import { getErrorMessage } from '../utils';

/** Who and what is being reviewed. Other modules open this screen with these details. */
export interface ReviewTarget {
  revieweeId: string;
  revieweeName: string;
  refType: ReviewRefType;
  refId: string;
  /** Shown under the name, e.g. "Laptop screen repair". */
  subject?: string;
}

interface WriteReviewScreenProps {
  target: ReviewTarget;
  onBack: () => void;
}

export const WriteReviewScreen: React.FC<WriteReviewScreenProps> = ({ target, onBack }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [isDone, setIsDone] = useState(false);

  const submit = async () => {
    setMessage(null);
    if (rating === 0) {
      setMessage({ text: 'Please choose a rating from 1 to 5 stars.', type: 'error' });
      return;
    }
    setIsSaving(true);
    try {
      await reviewService.create({
        revieweeId: target.revieweeId,
        refType: target.refType,
        refId: target.refId,
        rating,
        comment,
      });
      setIsDone(true);
      setMessage({ text: `Thanks! Your review of ${target.revieweeName} was saved.`, type: 'success' });
    } catch (error) {
      setMessage({ text: getErrorMessage(error, 'Could not save your review.'), type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} accessibilityRole="button" hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.topTitle}>Leave a review</Text>
        <View style={styles.topSpacer} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.name}>{target.revieweeName}</Text>
          {target.subject ? <Text style={styles.subject}>{target.subject}</Text> : null}

          <Text style={styles.question}>How was your experience?</Text>
          <RatingStars
            rating={rating}
            onRatingChange={isDone ? undefined : setRating}
            size={40}
            showLabel
            style={styles.stars}
          />

          <FormInput
            label="Comment (optional)"
            value={comment}
            onChangeText={setComment}
            placeholder="What went well? What could be better?"
            multiline
            maxLength={REVIEW_COMMENT_MAX}
            editable={!isDone}
            style={styles.comment}
          />
          <Text style={styles.counter}>
            {comment.length}/{REVIEW_COMMENT_MAX}
          </Text>

          <MessageBanner message={message?.text ?? null} type={message?.type} />
          {isDone ? (
            <PrimaryButton title="Done" onPress={onBack} />
          ) : (
            <PrimaryButton title="Submit review" onPress={submit} loading={isSaving} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
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
  name: { fontSize: 20, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  subject: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginTop: 4 },
  question: { fontSize: 16, fontWeight: '600', color: COLORS.text, textAlign: 'center', marginTop: 24 },
  stars: { marginVertical: 16 },
  comment: { minHeight: 100, textAlignVertical: 'top' },
  counter: { fontSize: 12, color: COLORS.textMuted, textAlign: 'right', marginTop: -8, marginBottom: 12 },
});
