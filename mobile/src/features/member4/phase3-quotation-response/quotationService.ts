// ============================================================================
// Phase 3 - Client Quotation & Response Service
// ============================================================================

import { RepairRequest, RepairStatus, ApiResponse } from '../../../types';
import { ProviderResponseFormData } from './types';

export class MobileQuotationService {
  private inMemoryRequests: RepairRequest[] = [
    {
      id: 'req_rep_101',
      itemId: 'item_laptop_001',
      customerId: 'usr_cust_001',
      providerId: 'prov_fixit_001',
      problemDescription: 'MacBook Pro battery swelling and shuts down below 40% battery charge.',
      preferredDate: '2025-03-25T10:00:00.000Z',
      preferredTime: '10:00 AM',
      notes: 'Please let me know if diagnostic fee applies.',
      status: RepairStatus.POSTED,
      createdAt: '2025-03-20T09:30:00.000Z',
      updatedAt: '2025-03-20T09:30:00.000Z',
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
    },
    {
      id: 'req_rep_102',
      itemId: 'item_phone_002',
      customerId: 'usr_cust_002',
      providerId: 'prov_fixit_001',
      problemDescription: 'iPhone 13 OLED screen shattered after drop. Touch digitizer unresponsive in top right corner.',
      preferredDate: '2025-03-26T14:00:00.000Z',
      preferredTime: '2:00 PM',
      status: RepairStatus.POSTED,
      createdAt: '2025-03-21T11:15:00.000Z',
      updatedAt: '2025-03-21T11:15:00.000Z',
      itemSummary: {
        id: 'item_phone_002',
        title: 'iPhone 13 Pro',
        category: 'Smartphones',
        imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9',
      },
      customerSummary: {
        id: 'usr_cust_002',
        name: 'Michael Scott',
        email: 'michael@dunder.test',
        phone: '+1-555-0122',
      },
    },
  ];

  async getIncomingRequests(providerId: string): Promise<ApiResponse<RepairRequest[]>> {
    try {
      const list = this.inMemoryRequests.filter((r) => r.providerId === providerId);
      return {
        success: true,
        statusCode: 200,
        data: list,
      };
    } catch (err: any) {
      return {
        success: false,
        statusCode: 500,
        error: err.message || 'Failed to load provider requests',
      };
    }
  }

  async submitResponse(
    requestId: string,
    data: ProviderResponseFormData
  ): Promise<ApiResponse<RepairRequest>> {
    try {
      if (data.action === 'ACCEPT') {
        if (data.estimatedPrice === undefined || data.estimatedPrice < 0) {
          return {
            success: false,
            statusCode: 400,
            error: 'A non-negative estimated price quotation is required.',
          };
        }
      }

      if (data.action === 'REJECT') {
        if (!data.rejectionReason || data.rejectionReason.trim().length < 5) {
          return {
            success: false,
            statusCode: 400,
            error: 'Please specify a rejection reason (minimum 5 characters).',
          };
        }
      }

      const reqIndex = this.inMemoryRequests.findIndex((r) => r.id === requestId);
      if (reqIndex === -1) {
        return {
          success: false,
          statusCode: 404,
          error: `Repair request '${requestId}' not found.`,
        };
      }

      const current = this.inMemoryRequests[reqIndex];
      const updated: RepairRequest = {
        ...current,
        status: data.action === 'ACCEPT' ? RepairStatus.ACCEPTED : RepairStatus.REJECTED,
        estimatedPrice: data.action === 'ACCEPT' ? data.estimatedPrice : undefined,
        providerNotes: data.providerNotes,
        rejectionReason: data.action === 'REJECT' ? data.rejectionReason : undefined,
        updatedAt: new Date().toISOString(),
      };

      this.inMemoryRequests[reqIndex] = updated;

      return {
        success: true,
        statusCode: 200,
        data: updated,
        message: `Request successfully ${data.action === 'ACCEPT' ? 'accepted with quotation' : 'rejected'}.`,
      };
    } catch (err: any) {
      return {
        success: false,
        statusCode: 500,
        error: err.message || 'Failed to submit response',
      };
    }
  }
}

export const mobileQuotationService = new MobileQuotationService();
