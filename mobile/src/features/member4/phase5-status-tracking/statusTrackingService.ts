// ============================================================================
// Phase 5 - Client Status Tracking Service
// ============================================================================

import { RepairRequest, RepairStatus, ApiResponse } from '../types';
import { repairService } from '../repair.service';

export class MobileStatusTrackingService {
  async getRequestStatus(requestId: string): Promise<ApiResponse<RepairRequest>> {
    return repairService.getRequestStatus(requestId);
  }

  async updateStatus(
    requestId: string,
    targetStatus: RepairStatus,
    notes?: string
  ): Promise<ApiResponse<RepairRequest>> {
    try {
      const data = await repairService.updateStatus(requestId, targetStatus, notes);
      return {
        success: true,
        statusCode: 200,
        data,
        message: `Status updated to ${targetStatus}`,
      };
    } catch (err: any) {
      return {
        success: false,
        statusCode: 400,
        error: err.message || 'Failed to update status',
      };
    }
  }
}

export const mobileStatusTrackingService = new MobileStatusTrackingService();
