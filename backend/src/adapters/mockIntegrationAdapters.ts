// ============================================================================
// Member 4 - Mock & Integration Adapters Layer
// Isolate dependencies from Member 1 (Auth), Member 2 (Items), Member 3 (Discovery), Member 6 (Eco/Review)
// ============================================================================

export interface MockCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface MockItem {
  id: string;
  title: string;
  category: string;
  description: string;
  condition: string;
  imageUrl?: string;
  ownerId: string;
}

// ----------------------------------------------------------------------------
// MEMBER 1 ADAPTER: Auth & User Identity
// Replace with actual JWT / req.user context upon integration
// ----------------------------------------------------------------------------
export const AuthIntegrationAdapter = {
  getCurrentCustomer(): MockCustomer {
    return {
      id: 'usr_cust_001',
      name: 'Jane Doe',
      email: 'jane.doe@revivex.test',
      phone: '+1-555-0199',
    };
  },

  getCurrentProviderUser() {
    return {
      id: 'usr_prov_001',
      name: 'Alex Tech Master',
      email: 'alex@techrepairs.test',
      providerId: 'prov_fixit_001',
    };
  },
};

// ----------------------------------------------------------------------------
// MEMBER 2 ADAPTER: Electronic Item Registry
// Replace with real ItemService query upon integration
// ----------------------------------------------------------------------------
export const ItemIntegrationAdapter = {
  getItemById(itemId: string): MockItem {
    const registry: Record<string, MockItem> = {
      'item_laptop_001': {
        id: 'item_laptop_001',
        title: 'MacBook Pro 15" (2019)',
        category: 'Laptops',
        description: 'Battery draining fast and overheating under moderate load.',
        condition: 'Used - Moderate',
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8',
        ownerId: 'usr_cust_001',
      },
      'item_phone_002': {
        id: 'item_phone_002',
        title: 'iPhone 13 Pro',
        category: 'Smartphones',
        description: 'Cracked front glass and unresponsive touch near top.',
        condition: 'Damaged Screen',
        imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9',
        ownerId: 'usr_cust_001',
      },
    };

    return registry[itemId] || {
      id: itemId,
      title: 'Electronic Device',
      category: 'Electronics',
      description: 'Device requiring diagnostic and repair service.',
      condition: 'Used',
      ownerId: 'usr_cust_001',
    };
  },
};

// ----------------------------------------------------------------------------
// MEMBER 3 ADAPTER: Smart Recommendation & Discovery
// Replace with Member 3 Recommendation Engine upon integration
// ----------------------------------------------------------------------------
export const DiscoveryIntegrationAdapter = {
  getDistanceKm(userLocation: string, providerLocation: string): number {
    return 3.2; // default simulated distance
  },
};

// ----------------------------------------------------------------------------
// MEMBER 6 ADAPTER: Communication, Reviews & Eco Impact Hooks
// Prepared integration hooks triggered on repair lifecycle milestones
// ----------------------------------------------------------------------------
export const EcoReviewIntegrationAdapter = {
  onRepairCompleted(payload: {
    repairRequestId: string;
    customerId: string;
    providerId: string;
    deviceCategory: string;
  }) {
    // Future integration placeholder:
    // 1. Notify Member 6 Eco engine to calculate e-waste diverted
    // 2. Award Eco points to customer & provider
    // 3. Trigger Review eligibility prompt for customer
    // 4. Send Firebase notification to both parties
    return {
      status: 'HANDLED_HOOK',
      timestamp: new Date().toISOString(),
      eWasteKgDivertedEstimate: 1.8,
      ecoPointsAwardedEstimate: 50,
      reviewEligible: true,
      ...payload,
    };
  },
};
