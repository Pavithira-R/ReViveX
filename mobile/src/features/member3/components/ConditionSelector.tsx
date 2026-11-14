// ============================================================================
// Member 3 - ConditionSelector Component
// Radio choice list for device working condition (Step 2)
// Includes integration with DeviceHealthCheckModal for automated diagnosis
// ============================================================================

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DeviceCondition } from '../types';
import { DeviceHealthReport } from '../types/healthCheck.types';
import { DeviceHealthCheckModal } from './DeviceHealthCheckModal';
import { CONDITION_META, COLORS, RADIUS, SPACING } from '../constants/theme';

interface ConditionSelectorProps {
  selectedCondition: DeviceCondition | null;
  onSelectCondition: (condition: DeviceCondition) => void;
  onOpenHealthCheck?: () => void;
  diagnosedCondition?: DeviceCondition | null;
  diagnosedScore?: number | null;
}

const CONDITIONS: DeviceCondition[] = [
  'WORKING_NORMALLY',
  'WORKING_WITH_PROBLEMS',
  'NOT_WORKING',
  'PHYSICALLY_DAMAGED',
];

export const ConditionSelector: React.FC<ConditionSelectorProps> = ({
  selectedCondition,
  onSelectCondition,
  onOpenHealthCheck,
  diagnosedCondition,
  diagnosedScore,
}) => {
  const [internalModalVisible, setInternalModalVisible] = useState(false);
  const [internalDiagnosed, setInternalDiagnosed] = useState<{
    condition: DeviceCondition;
    score: number;
  } | null>(null);

  const activeDiagnosedCondition = diagnosedCondition || internalDiagnosed?.condition;
  const activeDiagnosedScore = diagnosedScore ?? internalDiagnosed?.score;

  const handleOpenDiagnostic = () => {
    if (onOpenHealthCheck) {
      onOpenHealthCheck();
    } else {
      setInternalModalVisible(true);
    }
  };

  const handleApplyReport = (condition: DeviceCondition, report: DeviceHealthReport) => {
    setInternalDiagnosed({
      condition,
      score: report.overallScore,
    });
    onSelectCondition(condition);
    setInternalModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* 30-Second Diagnostic Assistant Banner */}
      <TouchableOpacity
        style={styles.diagnosticBanner}
        onPress={handleOpenDiagnostic}
        activeOpacity={0.8}
      >
        <View style={styles.diagnosticIconWrap}>
          <Text style={styles.diagnosticIcon}>🩺</Text>
        </View>
        <View style={styles.diagnosticContent}>
          <Text style={styles.diagnosticTitle}>Uncertain about condition?</Text>
          <Text style={styles.diagnosticSub}>
            Run our 30-sec hardware health check (Screen, Battery, Camera & Sensors)
          </Text>
          {activeDiagnosedScore !== undefined && activeDiagnosedScore !== null && (
            <View style={styles.diagnosedTag}>
              <Text style={styles.diagnosedTagText}>
                ✓ Diagnosed Score: {activeDiagnosedScore}% (
                {activeDiagnosedCondition ? CONDITION_META[activeDiagnosedCondition].label : ''})
              </Text>
            </View>
          )}
        </View>
        <View style={styles.diagnosticAction}>
          <Text style={styles.diagnosticActionText}>
            {activeDiagnosedCondition ? 'Re-run ↻' : 'Start →'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Manual Selection Options */}
      {CONDITIONS.map((cond) => {
        const meta = CONDITION_META[cond];
        const isSelected = selectedCondition === cond;
        const isAutoDiagnosed = activeDiagnosedCondition === cond;

        return (
          <TouchableOpacity
            key={cond}
            style={[
              styles.rowCard,
              isSelected && styles.rowCardSelected,
              isAutoDiagnosed && !isSelected && styles.rowCardDiagnosedHint,
            ]}
            onPress={() => onSelectCondition(cond)}
            activeOpacity={0.7}
          >
            <View style={styles.radioContainer}>
              <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                {isSelected && <View style={styles.radioInner} />}
              </View>
            </View>

            <View style={styles.content}>
              <View style={styles.headerRow}>
                <View style={styles.titleWithBadge}>
                  <Text style={[styles.title, isSelected && styles.titleSelected]}>
                    {meta.label}
                  </Text>
                  {isAutoDiagnosed && (
                    <View style={styles.autoDiagnosedPill}>
                      <Text style={styles.autoDiagnosedText}>DIAGNOSED</Text>
                    </View>
                  )}
                </View>
                <View style={[styles.badge, { backgroundColor: meta.bgColor }]}>
                  <Text style={[styles.badgeText, { color: meta.color }]}>{meta.badge}</Text>
                </View>
              </View>
              <Text style={styles.description}>{meta.description}</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Built-in Health Check Modal when no external handler is passed */}
      {!onOpenHealthCheck && (
        <DeviceHealthCheckModal
          visible={internalModalVisible}
          onApplyCondition={handleApplyReport}
          onClose={() => setInternalModalVisible(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  diagnosticBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    padding: SPACING.md,
    marginBottom: SPACING.xs,
  },
  diagnosticIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  diagnosticIcon: {
    fontSize: 20,
  },
  diagnosticContent: {
    flex: 1,
  },
  diagnosticTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#312E81',
  },
  diagnosticSub: {
    fontSize: 12,
    color: '#4338CA',
    lineHeight: 16,
    marginTop: 2,
  },
  diagnosedTag: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  diagnosedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  diagnosticAction: {
    marginLeft: SPACING.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#4F46E5',
    borderRadius: RADIUS.sm,
  },
  diagnosticActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  rowCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  rowCardDiagnosedHint: {
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
  },
  radioContainer: {
    marginRight: SPACING.md,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  titleSelected: {
    color: COLORS.primaryDark,
  },
  autoDiagnosedPill: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  autoDiagnosedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
});
