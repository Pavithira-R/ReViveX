import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RepairStatus } from '../../../types';
import { Colors, Spacing, BorderRadius, Typography } from '../../../theme';

interface ProgressTrackerProps {
  currentStatus: RepairStatus;
}

interface StepInfo {
  status: RepairStatus;
  title: string;
  subtitle: string;
}

const STEPS: StepInfo[] = [
  {
    status: RepairStatus.POSTED,
    title: '1. Request Logged',
    subtitle: 'Diagnostic request submitted',
  },
  {
    status: RepairStatus.ACCEPTED,
    title: '2. Quotation Accepted',
    subtitle: 'Price agreed & appointment booked',
  },
  {
    status: RepairStatus.IN_PROGRESS,
    title: '3. Repair In Progress',
    subtitle: 'Technician working on device',
  },
  {
    status: RepairStatus.COMPLETED,
    title: '4. Ready for Pickup',
    subtitle: 'Repair finished & tested',
  },
];

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ currentStatus }) => {
  const getStepIndex = (status: RepairStatus): number => {
    switch (status) {
      case RepairStatus.POSTED:
      case RepairStatus.MATCHED:
        return 0;
      case RepairStatus.ACCEPTED:
        return 1;
      case RepairStatus.IN_PROGRESS:
        return 2;
      case RepairStatus.COMPLETED:
        return 3;
      default:
        return -1;
    }
  };

  const currentIndex = getStepIndex(currentStatus);
  const isTerminalDeclined = currentStatus === RepairStatus.REJECTED || currentStatus === RepairStatus.CANCELLED;

  if (isTerminalDeclined) {
    return (
      <View style={styles.terminalContainer}>
        <Text style={styles.terminalIcon}>⚠️</Text>
        <Text style={styles.terminalTitle}>
          {currentStatus === RepairStatus.REJECTED ? 'Repair Request Declined' : 'Repair Cancelled'}
        </Text>
        <Text style={styles.terminalSubtitle}>
          This repair request is closed and not progressing through active repair stages.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {STEPS.map((step, index) => {
        const isDone = currentIndex > index;
        const isCurrent = currentIndex === index;
        const isPending = currentIndex < index;
        const isLast = index === STEPS.length - 1;

        return (
          <View key={step.status} style={styles.stepRow}>
            {/* Indicator Column */}
            <View style={styles.indicatorCol}>
              <View
                style={[
                  styles.circle,
                  isDone && styles.doneCircle,
                  isCurrent && styles.currentCircle,
                  isPending && styles.pendingCircle,
                ]}
              >
                {isDone ? (
                  <Text style={styles.doneText}>✓</Text>
                ) : (
                  <Text
                    style={[
                      styles.circleNumber,
                      isCurrent && styles.currentCircleNumber,
                      isPending && styles.pendingCircleNumber,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>

              {!isLast && (
                <View
                  style={[
                    styles.connectorLine,
                    isDone ? styles.doneLine : styles.pendingLine,
                  ]}
                />
              )}
            </View>

            {/* Step Details Column */}
            <View style={styles.detailsCol}>
              <Text
                style={[
                  styles.stepTitle,
                  isCurrent && styles.currentStepTitle,
                  isDone && styles.doneStepTitle,
                  isPending && styles.pendingStepTitle,
                ]}
              >
                {step.title}
              </Text>
              <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 58,
  },
  indicatorCol: {
    alignItems: 'center',
    width: 32,
    marginRight: Spacing.md,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  doneCircle: {
    backgroundColor: Colors.success,
  },
  currentCircle: {
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.primaryLight,
  },
  pendingCircle: {
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  doneText: {
    color: Colors.textWhite,
    fontSize: 14,
    fontWeight: Typography.fontWeights.bold,
  },
  circleNumber: {
    fontSize: 12,
    fontWeight: Typography.fontWeights.bold,
  },
  currentCircleNumber: {
    color: Colors.textWhite,
  },
  pendingCircleNumber: {
    color: Colors.textMuted,
  },
  connectorLine: {
    width: 2,
    flex: 1,
    marginVertical: 2,
  },
  doneLine: {
    backgroundColor: Colors.success,
  },
  pendingLine: {
    backgroundColor: Colors.border,
  },
  detailsCol: {
    flex: 1,
    paddingTop: 2,
  },
  stepTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
  },
  currentStepTitle: {
    color: Colors.primaryDark,
  },
  doneStepTitle: {
    color: Colors.textPrimary,
  },
  pendingStepTitle: {
    color: Colors.textMuted,
  },
  stepSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  terminalContainer: {
    alignItems: 'center',
    backgroundColor: Colors.dangerLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  terminalIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  terminalTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.danger,
  },
  terminalSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
});
