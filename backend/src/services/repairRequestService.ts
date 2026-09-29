// ============================================================================
// Member 4 - Repair Request Service (Phase 2, 3, 5)
// ============================================================================

import { RepairRequest, RepairStatus } from '../types';
import { CreateRepairRequestInput } from '../validators/repairRequestValidator';
import { ItemIntegrationAdapter, AuthIntegrationAdapter } from '../adapters/mockIntegrationAdapters';
import { providerService } from './providerService';

export class RepairRequestService {
  private requests: RepairRequest[] = [
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
  ];

  async createRepairRequest(input: CreateRepairRequestInput): Promise<RepairRequest> {
    // 1. Validate that the provider exists
    const provider = await providerService.getProviderById(input.providerId);
    if (!provider) {
      throw new Error(`Service Provider '${input.providerId}' does not exist.`);
    }

    // 2. Fetch item summary from Member 2 Adapter
    const item = ItemIntegrationAdapter.getItemById(input.itemId);

    // 3. Construct repair request record
    const id = `req_rep_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const newRequest: RepairRequest = {
      id,
      itemId: input.itemId,
      customerId: input.customerId,
      providerId: input.providerId,
      problemDescription: input.problemDescription,
      preferredDate: input.preferredDate,
      preferredTime: input.preferredTime || 'Morning (9 AM - 12 PM)',
      notes: input.notes,
      status: RepairStatus.POSTED,
      createdAt: now,
      updatedAt: now,
      itemSummary: {
        id: item.id,
        title: item.title,
        category: item.category,
        imageUrl: item.imageUrl,
      },
      customerSummary: {
        id: input.customerId,
        name: 'Jane Doe',
        email: 'customer@revivex.test',
      },
      providerSummary: {
        id: provider.id,
        businessName: provider.businessName,
        rating: provider.rating,
        location: provider.location,
      },
    };

    this.requests.push(newRequest);
    return newRequest;
  }

  async getRequestById(id: string): Promise<RepairRequest | null> {
    const found = this.requests.find((r) => r.id === id);
    return found || null;
  }

  async getRequestsByCustomer(customerId: string): Promise<RepairRequest[]> {
    return this.requests.filter((r) => r.customerId === customerId);
  }

  async getRequestsByProvider(providerId: string): Promise<RepairRequest[]> {
    return this.requests.filter((r) => r.providerId === providerId);
  }

  async getAllRequests(): Promise<RepairRequest[]> {
    return [...this.requests];
  }

  // Update full request entity (used internally by Phase 3 and Phase 5)
  async updateRequest(updated: RepairRequest): Promise<RepairRequest> {
    const index = this.requests.findIndex((r) => r.id === updated.id);
    if (index === -1) {
      throw new Error(`Repair Request '${updated.id}' not found.`);
    }
    this.requests[index] = {
      ...updated,
      updatedAt: new Date().toISOString(),
    };
    return this.requests[index];
  }
}

export const repairRequestService = new RepairRequestService();
