// ============================================================================
// Phase 3 - Quotation & Provider Response Types
// ============================================================================

import { RepairRequest, RepairStatus } from '../../../types';

export type { RepairRequest };

export interface ProviderResponseFormData {
  action: 'ACCEPT' | 'REJECT';
  estimatedPrice?: number;
  providerNotes?: string;
  rejectionReason?: string;
}

export interface ProviderRequestsState {
  requests: RepairRequest[];
  selectedRequest: RepairRequest | null;
  isLoading: boolean;
  error: string | null;
  activeFilter: 'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
}
