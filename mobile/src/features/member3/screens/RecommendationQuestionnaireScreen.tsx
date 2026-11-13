// ============================================================================
// Member 3 - RecommendationQuestionnaireScreen Component
// 4-Step Interactive Smart Recommendation Wizard
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  DeviceCategory,
  DeviceCondition,
  DeviceAgeGroup,
  UserIntention,
  ResolutionUrgency,
  RecommendationInput,
  RecommendationResult,
} from '../types';
import { evaluateRecommendation } from '../services/recommendationService';
import { DEFAULT_USER_COORDINATES } from '../utils/location';
import { CategoryGrid } from '../components/CategoryGrid';
import { ConditionSelector } from '../components/ConditionSelector';
import { AgeGroupChips } from '../components/AgeGroupChips';
import { IntentionRadioList } from '../components/IntentionRadioList';
import { UrgencyToggle } from '../components/UrgencyToggle';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

interface RecommendationQuestionnaireScreenProps {
  onComplete: (result: RecommendationResult) => void;
  onCancel: () => void;
}

export const RecommendationQuestionnaireScreen: React.FC<
  RecommendationQuestionnaireScreenProps
> = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [category, setCategory] = useState<DeviceCategory | null>(null);
  const [condition, setCondition] = useState<DeviceCondition | null>(null);
  const [ageGroup, setAgeGroup] = useState<DeviceAgeGroup | null>(null);
  const [userIntention, setUserIntention] = useState<UserIntention | null>(null);
  const [urgency, setUrgency] = useState<ResolutionUrgency>('FLEXIBLE');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validation per step
  const isCurrentStepValid = (): boolean => {
    switch (currentStep) {
      case 1:
        return category !== null;
      case 2:
        return condition !== null;
      case 3:
        return ageGroup !== null;
      case 4:
        return userIntention !== null;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!isCurrentStepValid()) {
      setErrorMessage('Please select an option before continuing.');
      return;
    }
    setErrorMessage(null);
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      onCancel();
    }
  };

  const handleSubmit = async () => {
    if (!category || !condition || !ageGroup || !userIntention) {
      setErrorMessage('Please fill in all assessment questions.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const payload: RecommendationInput = {
      category,
      condition,
      ageGroup,
      userIntention,
      urgency,
      userCoordinates: DEFAULT_USER_COORDINATES,
    };

    try {
      const response = await evaluateRecommendation(payload);
      onComplete(response.result);
    } catch (err: any) {
      console.error('Questionnaire submission failed:', err);
      setErrorMessage(
        err.message || 'Unable to generate recommendation. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = [
    'What kind of device are you evaluating?',
    'What is the current working condition?',
    'Roughly how old is the device?',
    'What is your main intention for this item?',
  ];

  const stepSubtitles = [
    'Select the closest hardware classification below.',
    'Helps us assess repairability, market value, and safety.',
    'Hardware lifecycle affects compatibility and component value.',
    'Tell us your goal so we can guide you to the right partner.',
  ];

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>{currentStep === 1 ? '✕ Exit' : '← Back'}</Text>
        </TouchableOpacity>

        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>Step {currentStep} of 4</Text>
        </View>

        <View style={styles.headerPlaceholder} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${(currentStep / 4) * 100}%` },
          ]}
        />
      </View>

      {/* Loading Overlay */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingTitle}>Analyzing Circular Feasibility...</Text>
          <Text style={styles.loadingSubtitle}>
            Matching your hardware against repair workshops, second-hand buyers, and certified drop-off points
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Step Header */}
          <View style={styles.promptContainer}>
            <Text style={styles.promptTitle}>{stepTitles[currentStep - 1]}</Text>
            <Text style={styles.promptSubtitle}>
              {stepSubtitles[currentStep - 1]}
            </Text>
          </View>

          {/* Error Banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
            </View>
          )}

          {/* Step 1: Device Category */}
          {currentStep === 1 && (
            <CategoryGrid
              selectedCategory={category}
              onSelectCategory={(cat) => {
                setCategory(cat);
                setErrorMessage(null);
              }}
            />
          )}

          {/* Step 2: Working Condition */}
          {currentStep === 2 && (
            <ConditionSelector
              selectedCondition={condition}
              onSelectCondition={(cond) => {
                setCondition(cond);
                setErrorMessage(null);
              }}
            />
          )}

          {/* Step 3: Age Group */}
          {currentStep === 3 && (
            <AgeGroupChips
              selectedAgeGroup={ageGroup}
              onSelectAgeGroup={(age) => {
                setAgeGroup(age);
                setErrorMessage(null);
              }}
            />
          )}

          {/* Step 4: User Intention & Urgency */}
          {currentStep === 4 && (
            <View>
              <IntentionRadioList
                selectedIntention={userIntention}
                onSelectIntention={(intent) => {
                  setUserIntention(intent);
                  setErrorMessage(null);
                }}
              />
              <UrgencyToggle urgency={urgency} onChangeUrgency={setUrgency} />
            </View>
          )}
        </ScrollView>
      )}

      {/* Footer Navigation Buttons */}
      {!loading && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              !isCurrentStepValid() && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === 4 ? 'Get Recommendation →' : 'Continue →'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    paddingVertical: SPACING.xs,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  stepIndicator: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  headerPlaceholder: {
    width: 48,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: COLORS.border,
    width: '100%',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: COLORS.primary,
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  promptContainer: {
    marginBottom: SPACING.xl,
  },
  promptTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 28,
    marginBottom: SPACING.xs,
  },
  promptSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.danger,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  loadingSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  nextButtonDisabled: {
    backgroundColor: COLORS.borderDark,
    opacity: 0.7,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textInverse,
  },
});
