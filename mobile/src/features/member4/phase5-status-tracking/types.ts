// ============================================================================
// Phase 5 - Repair Status Tracking Types
// ============================================================================

import { RepairRequest, RepairStatus } from '../types';

export type { RepairRequest, RepairStatus };

export interface StatusStep {
  status: RepairStatus;
  label: string;
  description: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface StatusTrackingState {
  request: RepairRequest | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  isProviderView: boolean;
}
