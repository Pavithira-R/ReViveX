// ============================================================================
// Phase 5 - Client Status Tracking Service
// ============================================================================

import { RepairRequest, RepairStatus, ApiResponse } from '../../../types';
import { MobileEcoReviewAdapter } from '../../../adapters/mockIntegrationAdapters';

export class MobileStatusTrackingService {
  private inMemoryRequests: Map<string, RepairRequest> = new Map();

  constructor() {
    const seed: RepairRequest = {
      id: 'req_rep_101',
      itemId: 'item_laptop_001',
      customerId: 'usr_cust_001',
      providerId: 'prov_fixit_001',
      problemDescription: 'MacBook Pro battery swelling and shuts down below 40% battery charge.',
      preferredDate: '2025-03-25T10:00:00.000Z',
      preferredTime: '10:00 AM',
      status: RepairStatus.ACCEPTED,
      estimatedPrice: 85.0,
      providerNotes: 'Battery replacement unit ordered. Repair ready to start upon drop-off.',
      createdAt: '2025-03-20T09:30:00.000Z',
      updatedAt: '2025-03-21T10:00:00.000Z',
      itemSummary: {
        id: 'item_laptop_001',
        title: 'MacBook Pro 15" (2019)',
        category: 'Laptops',
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8',
      },
      customerSummary: {
        id: 'usr_cust_001',
        name: 'Jane Doe',
        email: 'jane.doe@revivex.test',
        phone: '+1-555-0199',
      },
      providerSummary: {
        id: 'prov_fixit_001',
        businessName: 'FixIt Pro Electronics',
        rating: 4.9,
        location: 'Downtown Tech Hub, 4th Avenue, NY',
      },
    };
    this.inMemoryRequests.set(seed.id, seed);
  }

  async getRequestStatus(requestId: string): Promise<ApiResponse<RepairRequest>> {
    const found = this.inMemoryRequests.get(requestId);
    if (!found) {
      return {
        success: false,
        statusCode: 404,
        error: `Repair request '${requestId}' not found.`,
      };
    }
    return {
      success: true,
      statusCode: 200,
      data: found,
    };
  }

  async updateStatus(
    requestId: string,
    targetStatus: RepairStatus,
    notes?: string
  ): Promise<ApiResponse<RepairRequest>> {
    const current = this.inMemoryRequests.get(requestId);
    if (!current) {
      return {
        success: false,
        statusCode: 404,
        error: `Repair request '${requestId}' not found.`,
      };
    }

    // Status transition validation
    if (current.status === RepairStatus.COMPLETED) {
      return {
        success: false,
        statusCode: 400,
        error: 'Repair is already COMPLETED and cannot be modified.',
      };
    }

    const updated: RepairRequest = {
      ...current,
      status: targetStatus,
      providerNotes: notes || current.providerNotes,
      updatedAt: new Date().toISOString(),
    };

    this.inMemoryRequests.set(requestId, updated);

    // If completed, trigger future integration hook for Member 6
    if (targetStatus === RepairStatus.COMPLETED) {
      MobileEcoReviewAdapter.onRepairCompleted(requestId);
    }

    return {
      success: true,
      statusCode: 200,
      data: updated,
      message: `Status updated to ${targetStatus}`,
    };
  }
}

export const mobileStatusTrackingService = new MobileStatusTrackingService();
