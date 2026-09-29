// ============================================================================
// Member 4 - Repair Status Transition Engine (Phase 5)
// Centralized state machine & transition rules for repair lifecycle
// ============================================================================

import { RepairStatus } from '../types';
import { EcoReviewIntegrationAdapter } from '../adapters/mockIntegrationAdapters';

export interface TransitionValidationResult {
  allowed: boolean;
  error?: string;
}

export class StatusTransitionService {
  // Valid State Transitions Map
  private readonly allowedTransitions: Record<RepairStatus, RepairStatus[]> = {
    [RepairStatus.POSTED]: [RepairStatus.MATCHED, RepairStatus.ACCEPTED, RepairStatus.REJECTED, RepairStatus.CANCELLED],
    [RepairStatus.MATCHED]: [RepairStatus.ACCEPTED, RepairStatus.REJECTED, RepairStatus.CANCELLED],
    [RepairStatus.ACCEPTED]: [RepairStatus.IN_PROGRESS, RepairStatus.CANCELLED],
    [RepairStatus.IN_PROGRESS]: [RepairStatus.COMPLETED, RepairStatus.CANCELLED],
    [RepairStatus.COMPLETED]: [], // Terminal state - cannot be reopened
    [RepairStatus.REJECTED]: [],  // Terminal state
    [RepairStatus.CANCELLED]: [], // Terminal state
  };

  validateTransition(currentStatus: RepairStatus, targetStatus: RepairStatus): TransitionValidationResult {
    if (currentStatus === targetStatus) {
      return { allowed: true };
    }

    const possibleNextStates = this.allowedTransitions[currentStatus] || [];
    if (!possibleNextStates.includes(targetStatus)) {
      return {
        allowed: false,
        error: `Invalid status transition: Cannot transition repair from '${currentStatus}' to '${targetStatus}'. Allowed next states: [${possibleNextStates.join(', ')}]`,
      };
    }

    return { allowed: true };
  }

  getOrderedLifecycleSteps(): { status: RepairStatus; label: string; description: string }[] {
    return [
      {
        status: RepairStatus.POSTED,
        label: 'Request Posted',
        description: 'Problem logged & awaiting provider diagnostic review',
      },
      {
        status: RepairStatus.ACCEPTED,
        label: 'Quotation Accepted',
        description: 'Repair cost estimated & appointment scheduled',
      },
      {
        status: RepairStatus.IN_PROGRESS,
        label: 'Repair In Progress',
        description: 'Technician actively repairing device components',
      },
      {
        status: RepairStatus.COMPLETED,
        label: 'Completed & Ready',
        description: 'Diagnostic check passed & ready for pickup / delivery',
      },
    ];
  }

  handlePostCompletionHooks(payload: {
    repairRequestId: string;
    customerId: string;
    providerId: string;
    deviceCategory: string;
  }) {
    // Member 6 Integration Point - Isolated Hook
    return EcoReviewIntegrationAdapter.onRepairCompleted(payload);
  }
}

export const statusTransitionService = new StatusTransitionService();
