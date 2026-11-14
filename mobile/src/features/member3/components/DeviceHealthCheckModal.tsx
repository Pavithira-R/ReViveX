// ============================================================================
// Member 3 - DeviceHealthCheckModal Component
// Interactive 5-step hardware diagnostic modal (Touch, Camera, Battery, Accelerometer, Gyroscope)
// Automatically derives 0-100% health score and maps to DeviceCondition
// ============================================================================

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { DeviceCondition } from '../types';
import {
  HealthTestId,
  HealthTestResult,
  FourCornerTouchState,
  DeviceHealthReport,
} from '../types/healthCheck.types';
import {
  evaluateTouchTest,
  probeCameraCapability,
  probeBatteryCapability,
  probeAccelerometer,
  probeGyroscope,
  compileHealthReport,
} from '../services/healthCheckService';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

interface DeviceHealthCheckModalProps {
  visible: boolean;
  onApplyCondition: (condition: DeviceCondition, report: DeviceHealthReport) => void;
  onClose: () => void;
}

type DiagnosticStep = 'INTRO' | 'TOUCH_TEST' | 'BATTERY_QUESTION' | 'RUNNING_PROBES' | 'REPORT';

export const DeviceHealthCheckModal: React.FC<DeviceHealthCheckModalProps> = ({
  visible,
  onApplyCondition,
  onClose,
}) => {
  const [step, setStep] = useState<DiagnosticStep>('INTRO');
  const [touchState, setTouchState] = useState<FourCornerTouchState>({
    topLeft: false,
    topRight: false,
    bottomLeft: false,
    bottomRight: false,
  });
  const [batteryHoldsCharge, setBatteryHoldsCharge] = useState<boolean>(true);
  const [report, setReport] = useState<DeviceHealthReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const resetState = () => {
    setStep('INTRO');
    setTouchState({
      topLeft: false,
      topRight: false,
      bottomLeft: false,
      bottomRight: false,
    });
    setBatteryHoldsCharge(true);
    setReport(null);
  };

  const handleStartTouchTest = () => {
    setStep('TOUCH_TEST');
  };

  const handleCornerTouch = (corner: keyof FourCornerTouchState) => {
    const nextState = { ...touchState, [corner]: true };
    setTouchState(nextState);

    // If all four corners are touched, automatically advance to battery check
    if (nextState.topLeft && nextState.topRight && nextState.bottomLeft && nextState.bottomRight) {
      setTimeout(() => {
        setStep('BATTERY_QUESTION');
      }, 400);
    }
  };

  const handleBatteryAnswer = async (holdsCharge: boolean) => {
    setBatteryHoldsCharge(holdsCharge);
    setStep('RUNNING_PROBES');
    setLoading(true);

    try {
      // 1. Evaluate touch test
      const touchResult = evaluateTouchTest(touchState);

      // 2. Probe battery
      const batteryResult = await probeBatteryCapability(holdsCharge);

      // 3. Probe Camera
      const cameraResult = await probeCameraCapability();

      // 4. Probe Accelerometer
      const accelResult = await probeAccelerometer();

      // 5. Probe Gyroscope
      const gyroResult = await probeGyroscope();

      const testResults: Record<HealthTestId, HealthTestResult> = {
        TOUCH_SCREEN: touchResult,
        BATTERY: batteryResult,
        CAMERA: cameraResult,
        ACCELEROMETER: accelResult,
        GYROSCOPE: gyroResult,
      };

      const finalReport = compileHealthReport(testResults);
      setReport(finalReport);
      setStep('REPORT');
    } catch (err) {
      console.error('Diagnostic error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (report) {
      onApplyCondition(report.derivedCondition, report);
      onClose();
      resetState();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>🩺 Device Health Check</Text>
              <Text style={styles.subtitle}>
                Hardware diagnostic self-test to determine exact condition
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                onClose();
                resetState();
              }}
              style={styles.closeBtn}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* STEP 1: INTRO */}
          {step === 'INTRO' && (
            <View style={styles.stepContent}>
              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>What this check tests:</Text>
                <Text style={styles.infoItem}>• 📱 4-Corner Screen Touch Digitizer</Text>
                <Text style={styles.infoItem}>• 🔋 Battery Power Retention & Charging</Text>
                <Text style={styles.infoItem}>• 📷 Camera Sensor & Permissions</Text>
                <Text style={styles.infoItem}>• 🔄 Accelerometer & Gyroscope Motion Sensors</Text>
              </View>

              <Text style={styles.timeNotice}>⏱ Takes roughly 30 seconds to complete.</Text>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleStartTouchTest}>
                <Text style={styles.primaryBtnText}>Start Touch Screen Test</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: FOUR-CORNER TOUCH TEST */}
          {step === 'TOUCH_TEST' && (
            <View style={styles.stepContent}>
              <Text style={styles.instructionHeading}>Tap All 4 Green Target Corners:</Text>
              <Text style={styles.instructionSub}>
                Verifies touch responsiveness across the display digitizer.
              </Text>

              <View style={styles.touchCanvas}>
                {/* Top-Left */}
                <TouchableOpacity
                  style={[styles.cornerTarget, touchState.topLeft && styles.cornerTargetDone]}
                  onPress={() => handleCornerTouch('topLeft')}
                >
                  <Text style={styles.cornerLabel}>{touchState.topLeft ? '✓' : '1'}</Text>
                </TouchableOpacity>

                {/* Top-Right */}
                <TouchableOpacity
                  style={[styles.cornerTarget, touchState.topRight && styles.cornerTargetDone]}
                  onPress={() => handleCornerTouch('topRight')}
                >
                  <Text style={styles.cornerLabel}>{touchState.topRight ? '✓' : '2'}</Text>
                </TouchableOpacity>

                {/* Center status */}
                <View style={styles.canvasCenter}>
                  <Text style={styles.centerCount}>
                    {[
                      touchState.topLeft,
                      touchState.topRight,
                      touchState.bottomLeft,
                      touchState.bottomRight,
                    ].filter(Boolean).length}
                    /4
                  </Text>
                  <Text style={styles.centerPrompt}>Corners Tapped</Text>
                </View>

                {/* Bottom-Left */}
                <TouchableOpacity
                  style={[styles.cornerTarget, touchState.bottomLeft && styles.cornerTargetDone]}
                  onPress={() => handleCornerTouch('bottomLeft')}
                >
                  <Text style={styles.cornerLabel}>{touchState.bottomLeft ? '✓' : '3'}</Text>
                </TouchableOpacity>

                {/* Bottom-Right */}
                <TouchableOpacity
                  style={[styles.cornerTarget, touchState.bottomRight && styles.cornerTargetDone]}
                  onPress={() => handleCornerTouch('bottomRight')}
                >
                  <Text style={styles.cornerLabel}>{touchState.bottomRight ? '✓' : '4'}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.skipBtn}
                onPress={() => setStep('BATTERY_QUESTION')}
              >
                <Text style={styles.skipBtnText}>Skip / Corners Unresponsive →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: BATTERY QUESTION */}
          {step === 'BATTERY_QUESTION' && (
            <View style={styles.stepContent}>
              <Text style={styles.instructionHeading}>🔋 Battery & Power Check</Text>
              <Text style={styles.instructionSub}>
                Does the device stay powered on and hold a charge without the charging cable plugged in?
              </Text>

              <View style={styles.choiceRow}>
                <TouchableOpacity
                  style={styles.choiceBtn}
                  onPress={() => handleBatteryAnswer(true)}
                >
                  <Text style={styles.choiceIcon}>⚡</Text>
                  <Text style={styles.choiceTitle}>Yes, holds charge</Text>
                  <Text style={styles.choiceSub}>Battery powers device normally</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.choiceBtn, styles.choiceBtnDanger]}
                  onPress={() => handleBatteryAnswer(false)}
                >
                  <Text style={styles.choiceIcon}>🔌</Text>
                  <Text style={styles.choiceTitle}>No, shuts down</Text>
                  <Text style={styles.choiceSub}>Requires continuous charging</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 4: RUNNING PROBES */}
          {step === 'RUNNING_PROBES' && (
            <View style={[styles.stepContent, styles.centerProbes]}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.probeTitle}>Probing Sensors & Hardware...</Text>
              <Text style={styles.probeSub}>
                Checking Camera, Accelerometer, and Gyroscope orientation
              </Text>
            </View>
          )}

          {/* STEP 5: FINAL DIAGNOSTIC REPORT */}
          {step === 'REPORT' && report && (
            <ScrollView style={styles.reportScroll} showsVerticalScrollIndicator={false}>
              {/* Score Dial */}
              <View
                style={[
                  styles.scoreDial,
                  report.overallScore >= 80
                    ? styles.scoreDialGood
                    : report.overallScore >= 50
                    ? styles.scoreDialFair
                    : styles.scoreDialPoor,
                ]}
              >
                <Text style={styles.scoreNumber}>{report.overallScore}%</Text>
                <Text style={styles.scoreGrade}>{report.grade}</Text>
              </View>

              <Text style={styles.conditionHeadline}>
                Diagnosed Condition:{' '}
                <Text style={styles.conditionBold}>
                  {report.derivedCondition.replace(/_/g, ' ')}
                </Text>
              </Text>
              <Text style={styles.summaryText}>{report.summary}</Text>

              {/* Hardware Test Results */}
              <Text style={styles.breakdownHeader}>Diagnostic Tests Summary:</Text>
              {(Object.values(report.testResults) as HealthTestResult[]).map((res) => (
                <View key={res.id} style={styles.testResultRow}>
                  <View style={styles.testResultLeft}>
                    <Text style={styles.testResultName}>{res.name}</Text>
                    <Text style={styles.testResultDetails}>{res.details}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      res.status === 'PASSED'
                        ? styles.statusPassed
                        : res.status === 'FAILED'
                        ? styles.statusFailed
                        : styles.statusNeutral,
                    ]}
                  >
                    <Text style={styles.statusPillText}>{res.status}</Text>
                  </View>
                </View>
              ))}

              {/* Apply Button */}
              <TouchableOpacity style={styles.primaryBtn} onPress={handleApply}>
                <Text style={styles.primaryBtnText}>
                  Apply Diagnosed Condition to Assessment
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryBtn} onPress={resetState}>
                <Text style={styles.secondaryBtnText}>Retest Diagnostics</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '90%',
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    ...SHADOWS.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    maxWidth: 260,
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  closeIcon: {
    fontSize: 18,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  stepContent: {
    paddingVertical: SPACING.sm,
  },
  infoBox: {
    backgroundColor: COLORS.surfaceAlt,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  infoItem: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginVertical: 2,
  },
  timeNotice: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  instructionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  instructionSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  touchCanvas: {
    height: 240,
    backgroundColor: '#0F172A',
    borderRadius: RADIUS.lg,
    position: 'relative',
    marginVertical: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerTarget: {
    position: 'absolute',
    width: 60,
    height: 60,
    backgroundColor: '#334155',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerTargetDone: {
    backgroundColor: COLORS.primary,
    borderColor: '#4ADE80',
  },
  cornerLabel: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  canvasCenter: {
    alignItems: 'center',
  },
  centerCount: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '900',
  },
  centerPrompt: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  skipBtn: {
    alignSelf: 'center',
    paddingVertical: SPACING.sm,
    marginTop: SPACING.xs,
  },
  skipBtnText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '600',
  },
  choiceRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  choiceBtn: {
    flex: 1,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  choiceBtnDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: COLORS.danger,
  },
  choiceIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  choiceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  choiceSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  centerProbes: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  probeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  probeSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  reportScroll: {
    maxHeight: 460,
  },
  scoreDial: {
    alignSelf: 'center',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.sm,
  },
  scoreDialGood: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  scoreDialFair: {
    borderColor: COLORS.warning,
    backgroundColor: '#FFFBEB',
  },
  scoreDialPoor: {
    borderColor: COLORS.danger,
    backgroundColor: '#FEF2F2',
  },
  scoreNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  scoreGrade: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  conditionHeadline: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  conditionBold: {
    fontWeight: '800',
    color: COLORS.primary,
  },
  summaryText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  breakdownHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  testResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  testResultLeft: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  testResultName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  testResultDetails: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  statusPassed: {
    backgroundColor: '#DCFCE7',
  },
  statusFailed: {
    backgroundColor: '#FEE2E2',
  },
  statusNeutral: {
    backgroundColor: COLORS.surfaceAlt,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  primaryBtnText: {
    color: COLORS.textInverse,
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryBtn: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  secondaryBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },
});
