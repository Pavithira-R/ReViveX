// ============================================================================
// Member 3 - RecommendationResultScreen Component
// Presentation of outcome, rationale, eco metrics, matched entities, and CTAs
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  RecommendationResult,
  ServiceProviderSummary,
  ListingSummary,
  RecyclePointSummary,
} from '../types';
import { RecommendationResultCard } from '../components/RecommendationResultCard';
import { EcoSavingsBanner } from '../components/EcoSavingsBanner';
import { MatchedEntitiesCarousel } from '../components/MatchedEntitiesCarousel';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

interface RecommendationResultScreenProps {
  result: RecommendationResult;
  onPrimaryActionHandoff: (action: string, result: RecommendationResult) => void;
  onSelectProvider?: (provider: ServiceProviderSummary) => void;
  onSelectListing?: (listing: ListingSummary) => void;
  onSelectRecyclePoint?: (point: RecyclePointSummary) => void;
  onSaveToInventory?: (result: RecommendationResult) => void;
  onRetake: () => void;
  onGoHome: () => void;
}

export const RecommendationResultScreen: React.FC<RecommendationResultScreenProps> = ({
  result,
  onPrimaryActionHandoff,
  onSelectProvider,
  onSelectListing,
  onSelectRecyclePoint,
  onSaveToInventory,
  onRetake,
  onGoHome,
}) => {
  const [savedToInventory, setSavedToInventory] = useState<boolean>(false);

  const handleSaveItem = () => {
    setSavedToInventory(true);
    onSaveToInventory?.(result);
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoHome} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>✕ Close</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Evaluation Result</Text>

        <TouchableOpacity onPress={onRetake} style={styles.headerBtn}>
          <Text style={styles.retakeText}>Retake</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Outcome Card with Rationale */}
        <RecommendationResultCard result={result} />

        {/* Environmental Impact Banner */}
        <EcoSavingsBanner
          co2SavingsKg={result.estimatedCo2SavingsKg}
          ecoPoints={result.estimatedEcoPoints}
        />

        {/* Primary Call to Action Button */}
        <TouchableOpacity
          style={styles.primaryCta}
          onPress={() => onPrimaryActionHandoff(result.primaryAction, result)}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryCtaText}>
            {result.nextActionLabel || 'Proceed with Recommended Action'} →
          </Text>
        </TouchableOpacity>

        {/* Matched Entities Carousel */}
        <MatchedEntitiesCarousel
          result={result}
          onSelectProvider={onSelectProvider}
          onSelectListing={onSelectListing}
          onSelectRecyclePoint={onSelectRecyclePoint}
        />

        {/* Secondary Action: Save to My Items (Member 2 handoff) */}
        <View style={styles.secondaryActions}>
          <TouchableOpacity
            style={[styles.saveButton, savedToInventory && styles.saveButtonSaved]}
            onPress={handleSaveItem}
            disabled={savedToInventory}
            activeOpacity={0.8}
          >
            <Text style={[styles.saveText, savedToInventory && styles.saveTextSaved]}>
              {savedToInventory
                ? '✓ Saved to Inventory Draft'
                : '📥 Save Device to My Items (Inventory)'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Evaluation Metadata Footer */}
        <View style={styles.metaFooter}>
          <Text style={styles.metaText}>
            Evaluation ID: {result.evaluationId} • Generated{' '}
            {new Date(result.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerBtn: {
    paddingVertical: 4,
  },
  headerBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  retakeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  primaryCta: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.hover,
  },
  primaryCtaText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textInverse,
  },
  secondaryActions: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  saveButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  saveButtonSaved: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  saveText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  saveTextSaved: {
    color: COLORS.primaryDark,
  },
  metaFooter: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
