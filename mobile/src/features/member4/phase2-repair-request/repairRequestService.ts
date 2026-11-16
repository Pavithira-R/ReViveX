// ============================================================================
// Phase 2 - Client Repair Request Service
// ============================================================================

import { RepairRequest, ApiResponse } from '../types';
import { CreateRepairRequestFormData } from './types';
import { repairService } from '../repair.service';

export class MobileRepairRequestService {
  async submitRepairRequest(
    data: CreateRepairRequestFormData
  ): Promise<ApiResponse<RepairRequest>> {
    return repairService.submitRepairRequest({
      itemId: data.itemId,
      providerId: data.providerId,
      problemDescription: data.problemDescription,
      preferredDate: data.preferredDate,
      preferredTime: data.preferredTime,
      notes: data.notes,
    });
  }

  async getMyRequests(): Promise<ApiResponse<RepairRequest[]>> {
    return repairService.getMyRequests();
  }
}

export const mobileRepairRequestService = new MobileRepairRequestService();
