// ============================================================================
// Member 3 - Device Health Check Types & Contracts
// Specifications for hardware capability tests, diagnostic scoring & condition derivation
// ============================================================================

import { DeviceCondition } from './index';

export type HealthTestId =
  | 'TOUCH_SCREEN'
  | 'BATTERY'
  | 'ACCELEROMETER'
  | 'GYROSCOPE'
  | 'CAMERA';

export type HealthTestStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'PASSED'
  | 'FAILED'
  | 'UNSUPPORTED'
  | 'PERMISSION_DENIED';

export type HealthGrade = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';

export interface HealthTestResult {
  id: HealthTestId;
  name: string;
  description: string;
  status: HealthTestStatus;
  maxScore: number;
  earnedScore: number;
  details: string;
  defect?: string | null;
}

export interface FourCornerTouchState {
  topLeft: boolean;
  topRight: boolean;
  bottomLeft: boolean;
  bottomRight: boolean;
}

export interface DeviceHealthReport {
  overallScore: number; // 0 to 100
  derivedCondition: DeviceCondition;
  grade: HealthGrade;
  testResults: Record<HealthTestId, HealthTestResult>;
  defects: string[];
  summary: string;
  completedAt: string;
}
