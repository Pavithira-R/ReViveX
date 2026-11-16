// ============================================================================
// Phase 1 - Provider Client API Service
// ============================================================================

import { ServiceProvider, ApiResponse } from '../types';
import { repairService } from '../repair.service';

export class MobileProviderService {
  async fetchProviders(params?: { search?: string; category?: string }): Promise<ApiResponse<ServiceProvider[]>> {
    return repairService.fetchProviders(params);
  }

  async fetchProviderById(id: string): Promise<ApiResponse<ServiceProvider>> {
    return repairService.fetchProviderById(id);
  }
}

export const mobileProviderService = new MobileProviderService();
