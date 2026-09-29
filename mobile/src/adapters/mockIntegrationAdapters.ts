// ============================================================================
// Member 4 - Mobile Integration & Mock Adapters
// Isolate mock data so changing Member 1, 2, 3, 6 dependencies requires zero screen edits
// ============================================================================

export interface MockCustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
}

export interface MockItemDetails {
  id: string;
  title: string;
  category: string;
  condition: string;
  description: string;
  imageUrl?: string;
}

export const MobileAuthAdapter = {
  // Replace with `useAuth()` hook from Member 1
  getCurrentCustomer(): MockCustomerProfile {
    return {
      id: 'usr_cust_001',
      name: 'Jane Doe',
      email: 'jane.doe@revivex.test',
      phone: '+1-555-0199',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    };
  },

  // Replace with provider context for provider-side views
  getCurrentProvider() {
    return {
      id: 'prov_fixit_001',
      businessName: 'FixIt Pro Electronics',
      name: 'Alex Tech Master',
    };
  },
};

export const MobileItemAdapter = {
  // Replace with selected item navigation param or Member 2 item state
  getSelectedItem(): MockItemDetails {
    return {
      id: 'item_laptop_001',
      title: 'MacBook Pro 15" (2019)',
      category: 'Laptops',
      condition: 'Battery Warning / Throttling',
      description: 'Battery health degraded to 65%. Needs replacement before reuse.',
      imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8',
    };
  },
};

export const MobileDiscoveryAdapter = {
  // Replace with Member 3 smart location discovery
  getDefaultProviderId(): string {
    return 'prov_fixit_001';
  },
};

export const MobileEcoReviewAdapter = {
  // Prepared callback hook for Member 6 after Phase 5 completion
  onRepairCompleted(requestId: string) {
    console.log(`[Member 6 Integration Hook] Repair ${requestId} completed. Ready for Eco-points & Review flow.`);
  },
};
