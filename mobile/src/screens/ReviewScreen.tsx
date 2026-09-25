import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { RatingStars } from '../components/RatingStars';
import { TextInput } from '../components/common/TextInput';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { ErrorState } from '../components/common/ErrorState';
import { reviewService } from '../services/reviewService';

interface ReviewScreenProps {
  providerId?: string;
  providerName?: string;
  serviceName?: string;
  repairRequestId?: string;
  itemId?: string;
  onSuccess?: () => void;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({
  providerId = 'prov-tech-1', // Default for isolated Phase 1 development
  providerName = 'Lanka Electro Fix Solutions',
  serviceName = 'Motherboard & Screen Diagnostics',
  repairRequestId,
  itemId,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmittedSuccessfully, setIsSubmittedSuccessfully] = useState<boolean>(false);

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleSubmit = async () => {
    // 1. Client-Side Validation
    if (rating === 0) {
      setValidationError('Please select a rating between 1 and 5 stars.');
      return;
    }

    if (rating < 1 || rating > 5) {
      setValidationError('Rating must be an integer between 1 and 5.');
      return;
    }

    setValidationError(null);
    setApiError(null);
    setIsSubmitting(true);

    try {
      await reviewService.submitReview({
        rating,
        comment: comment.trim() || undefined,
        providerId,
        repairRequestId,
        itemId,
      });

      setIsSubmitting(false);
      setIsSubmittedSuccessfully(true);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setApiError(err?.message || 'Unable to submit review. Please try again.');
    }
  };

  const handleResetForm = () => {
    setRating(0);
    setComment('');
    setIsSubmittedSuccessfully(false);
    setApiError(null);
    setValidationError(null);
  };

  // SUCCESS CONFIRMATION STATE
  if (isSubmittedSuccessfully) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCard}>
          <View style={styles.successIconBadge}>
            <Text style={styles.checkmarkIcon}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Review Submitted!</Text>
          <Text style={styles.successMessage}>
            Thank you for rating {providerName}. Your honest feedback helps the
            ReViveX community build trust and choose dependable repair services.
          </Text>
          <View style={styles.submittedRatingSummary}>
            <RatingStars rating={rating} size={22} readOnly />
            {comment ? (
              <Text style={styles.submittedCommentQuote}>"{comment}"</Text>
            ) : null}
          </View>
          <Button
            title="Write Another Review"
            onPress={handleResetForm}
            variant="outline"
            style={styles.anotherReviewButton}
          />
        </View>
      </View>
    );
  }

  // REVIEW FORM STATE
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Title */}
        <View style={styles.header}>
          <Text style={styles.title}>Rate & Review</Text>
          <Text style={styles.subtitle}>
            Share your experience to help other device owners make informed choices.
          </Text>
        </View>

        {/* Target Provider Info Summary */}
        <Card style={styles.targetCard}>
          <Text style={styles.targetLabel}>Service Provider</Text>
          <Text style={styles.targetName}>{providerName}</Text>
          {serviceName && (
            <Text style={styles.targetService}>Service: {serviceName}</Text>
          )}
        </Card>

        {/* API Error Notification */}
        {apiError && (
          <ErrorState
            title="Submission Failed"
            message={apiError}
            onRetry={handleSubmit}
          />
        )}

        {/* Rating Section */}
        <Card style={styles.ratingCard}>
          <Text style={styles.sectionTitle}>Your Overall Rating</Text>
          <Text style={styles.sectionSubtitle}>Tap a star to rate from 1 to 5</Text>
          
          <RatingStars
            rating={rating}
            onRatingChange={handleRatingChange}
            size={40}
            showLabel
          />

          {validationError && (
            <Text style={styles.validationText}>{validationError}</Text>
          )}
        </Card>

        {/* Written Comment Section */}
        <Card style={styles.commentCard}>
          <Text style={styles.sectionTitle}>Written Review (Optional)</Text>
          <Text style={styles.sectionSubtitle}>
            What went well? Was the repair timely and fair?
          </Text>

          <TextInput
            placeholder="Write your comments here (optional)..."
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            characterCount={comment.length}
            maxCharacters={1000}
            editable={!isSubmitting}
          />
        </Card>

        {/* Submit Button */}
        <View style={styles.actionContainer}>
          <Button
            title={isSubmitting ? 'Submitting Review...' : 'Submit Review'}
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  header: {
    marginVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 20,
  },
  targetCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
    padding: 14,
  },
  targetLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    textTransform: 'uppercase',
  },
  targetName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
    marginTop: 2,
  },
  targetService: {
    fontSize: 13,
    color: '#047857',
    marginTop: 2,
  },
  ratingCard: {
    alignItems: 'center',
    paddingVertical: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 8,
  },
  validationText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  commentCard: {
    padding: 16,
  },
  actionContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  successContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 26,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  successIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  checkmarkIcon: {
    fontSize: 32,
    color: '#059669',
    fontWeight: '900',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 18,
  },
  submittedRatingSummary: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  submittedCommentQuote: {
    marginTop: 8,
    fontStyle: 'italic',
    color: '#374151',
    textAlign: 'center',
    fontSize: 13,
  },
  anotherReviewButton: {
    width: '100%',
  },
});
