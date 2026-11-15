// ============================================================================
// Phase 2 - Client Repair Request Service
// ============================================================================

import { RepairRequest, RepairStatus, ApiResponse } from '../../../types';
import { CreateRepairRequestFormData } from './types';
import { MobileAuthAdapter, MobileItemAdapter } from '../../../adapters/mockIntegrationAdapters';

export class MobileRepairRequestService {
  private inMemoryRequests: RepairRequest[] = [];

  async submitRepairRequest(
    data: CreateRepairRequestFormData
  ): Promise<ApiResponse<RepairRequest>> {
    try {
      // 1. Validate on client
      if (!data.providerId) {
        return { success: false, statusCode: 400, error: 'A service provider must be selected' };
      }
      if (!data.itemId) {
        return { success: false, statusCode: 400, error: 'An electronic item must be selected' };
      }
      if (!data.problemDescription || data.problemDescription.trim().length < 10) {
        return {
          success: false,
          statusCode: 400,
          error: 'Please describe the problem in at least 10 characters',
        };
      }
      if (!data.preferredDate) {
        return { success: false, statusCode: 400, error: 'Please choose a preferred date' };
      }

      const customer = MobileAuthAdapter.getCurrentCustomer();
      const item = MobileItemAdapter.getSelectedItem();

      const newRequest: RepairRequest = {
        id: `req_rep_${Date.now()}`,
        itemId: data.itemId,
        customerId: customer.id,
        providerId: data.providerId,
        problemDescription: data.problemDescription,
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime || '10:00 AM',
        notes: data.notes,
        status: RepairStatus.POSTED,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        itemSummary: {
          id: item.id,
          title: item.title,
          category: item.category,
          imageUrl: item.imageUrl,
        },
        customerSummary: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        },
      };

      this.inMemoryRequests.push(newRequest);

      return {
        success: true,
        statusCode: 201,
        data: newRequest,
        message: 'Repair request submitted successfully!',
      };
    } catch (err: any) {
      return {
        success: false,
        statusCode: 500,
        error: err.message || 'Server error creating repair request',
      };
    }
  }

  async getMyRequests(): Promise<ApiResponse<RepairRequest[]>> {
    return {
      success: true,
      statusCode: 200,
      data: this.inMemoryRequests,
    };
  }
}

export const mobileRepairRequestService = new MobileRepairRequestService();
