// ============================================================================
// Phase 3 - Client Quotation & Response Service
// ============================================================================

import { RepairRequest, ApiResponse } from '../types';
import { ProviderResponseFormData } from './types';
import { repairService } from '../repair.service';

export class MobileQuotationService {
  async getIncomingRequests(providerId?: string): Promise<ApiResponse<RepairRequest[]>> {
    return repairService.getIncomingRequests(providerId);
  }

  async submitResponse(
    requestId: string,
    data: ProviderResponseFormData
  ): Promise<ApiResponse<RepairRequest>> {
    return repairService.submitResponse(requestId, data);
  }
}

export const mobileQuotationService = new MobileQuotationService();
