// ============================================================================
// Phase 2 - Repair Request Types
// ============================================================================

import { RepairRequest, RepairStatus, ServiceProvider } from '../../../types';
import { MockItemDetails } from '../../../adapters/mockIntegrationAdapters';

export type { RepairRequest };

export interface CreateRepairRequestFormData {
  itemId: string;
  providerId: string;
  problemDescription: string;
  preferredDate: string;
  preferredTime: string;
  notes?: string;
}

export interface RepairRequestFormState {
  item: MockItemDetails | null;
  provider: ServiceProvider | null;
  formData: CreateRepairRequestFormData;
  isSubmitting: boolean;
  errors: Record<string, string>;
  isSuccess: boolean;
  createdRequest: RepairRequest | null;
}
