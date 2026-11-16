import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RepairStatus } from '../../types';
import { COLORS, FONT, RADIUS, SPACING } from '../../../../constants';

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
    status: RepairStatus.REQUESTED,
    title: '1. Request Sent',
    subtitle: 'Diagnostic request submitted',
  },
  {
    status: RepairStatus.QUOTED,
    title: '2. Quoted',
    subtitle: 'Price estimate received',
  },
  {
    status: RepairStatus.ACCEPTED,
    title: '3. Accepted',
    subtitle: 'Quotation accepted & booked',
  },
  {
    status: RepairStatus.ON_THE_WAY,
    title: '4. On The Way',
    subtitle: 'Technician transit / drop-off',
  },
  {
    status: RepairStatus.REPAIRING,
    title: '5. Repairing',
    subtitle: 'Technician working on device',
  },
  {
    status: RepairStatus.COMPLETED,
    title: '6. Completed',
    subtitle: 'Repair finished & tested',
  },
];

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ currentStatus }) => {
  const getStepIndex = (status: RepairStatus): number => {
    switch (status) {
      case RepairStatus.REQUESTED:
        return 0;
      case RepairStatus.QUOTED:
        return 1;
      case RepairStatus.ACCEPTED:
        return 2;
      case RepairStatus.ON_THE_WAY:
        return 3;
      case RepairStatus.REPAIRING:
      case RepairStatus.IN_PROGRESS:
        return 4;
      case RepairStatus.COMPLETED:
        return 5;
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
    paddingVertical: SPACING.sm,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 58,
  },
  indicatorCol: {
    alignItems: 'center',
    width: 32,
    marginRight: SPACING.md,
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
    backgroundColor: COLORS.success,
  },
  currentCircle: {
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
  },
  pendingCircle: {
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  doneText: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontWeight: '700',
  },
  circleNumber: {
    fontSize: 12,
    fontWeight: '700',
  },
  currentCircleNumber: {
    color: COLORS.textWhite,
  },
  pendingCircleNumber: {
    color: COLORS.textMuted,
  },
  connectorLine: {
    width: 2,
    flex: 1,
    marginVertical: 2,
  },
  doneLine: {
    backgroundColor: COLORS.success,
  },
  pendingLine: {
    backgroundColor: COLORS.border,
  },
  detailsCol: {
    flex: 1,
    paddingTop: 2,
  },
  stepTitle: {
    fontSize: FONT.sm,
    fontWeight: '700',
  },
  currentStepTitle: {
    color: COLORS.primaryDark,
  },
  doneStepTitle: {
    color: COLORS.text,
  },
  pendingStepTitle: {
    color: COLORS.textMuted,
  },
  stepSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  terminalContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.dangerLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  terminalIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  terminalTitle: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: COLORS.danger,
  },
  terminalSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
});
