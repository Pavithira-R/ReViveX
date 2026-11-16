// ============================================================================
// Phase 2 - Repair Request Types
// ============================================================================

import { RepairRequest, RepairStatus, ServiceProvider } from '../types';

export type { RepairRequest, RepairStatus, ServiceProvider };

export interface ItemSummaryDetails {
  id: string;
  title: string;
  category: string;
  imageUrl?: string;
}

export interface CreateRepairRequestFormData {
  itemId: string;
  providerId: string;
  problemDescription: string;
  preferredDate: string;
  preferredTime: string;
  notes?: string;
}

export interface RepairRequestFormState {
  item: ItemSummaryDetails | null;
  provider: ServiceProvider | null;
  formData: CreateRepairRequestFormData;
  isSubmitting: boolean;
  errors: Record<string, string>;
  isSuccess: boolean;
  createdRequest: RepairRequest | null;
}
