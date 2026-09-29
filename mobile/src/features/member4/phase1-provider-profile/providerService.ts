// ============================================================================
// Phase 1 - Provider Client API Service
// ============================================================================

import { ServiceProvider, ApiResponse } from '../../../types';

export class MobileProviderService {
  private fallbackProviders: ServiceProvider[] = [
    {
      id: 'prov_fixit_001',
      name: 'Alex Tech Master',
      businessName: 'FixIt Pro Electronics',
      profileImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758',
      isVerified: true,
      description: 'Certified repair technician with 8+ years specializing in Apple MacBooks, iPhones, iPads, and high-end laptops. OEM grade replacement parts and warranty included.',
      servicesOffered: [
        'Screen Replacement',
        'Battery Replacement',
        'Motherboard Micro-soldering',
        'Water Damage Diagnostic',
        'Storage Upgrade',
      ],
      availability: 'Mon - Sat: 9:00 AM - 6:00 PM',
      location: 'Downtown Tech Hub, 4th Avenue, NY',
      distanceKm: 2.4,
      rating: 4.9,
      reviewCount: 128,
      startingPrice: 35.0,
      currency: 'USD',
      phoneNumber: '+1 (555) 234-5678',
      email: 'alex@fixitpro.test',
    },
    {
      id: 'prov_eco_002',
      name: 'Samantha Green',
      businessName: 'GreenCircuits Repair Lab',
      profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
      isVerified: true,
      description: 'Eco-conscious electronics repair lab. We refurbish, repair and prolong gadget lifespans, diverting toxic e-waste from landfills.',
      servicesOffered: [
        'Smartphone Diagnostics',
        'Audio Equipment Repair',
        'Tablet Repair',
        'E-waste Pre-evaluation',
      ],
      availability: 'Mon - Fri: 10:00 AM - 7:00 PM',
      location: 'Westside Eco District, Unit 12, NY',
      distanceKm: 4.1,
      rating: 4.8,
      reviewCount: 94,
      startingPrice: 30.0,
      currency: 'USD',
      phoneNumber: '+1 (555) 876-5432',
      email: 'samantha@greencircuits.test',
    },
  ];

  async fetchProviders(params?: { search?: string; category?: string }): Promise<ApiResponse<ServiceProvider[]>> {
    try {
      // Simulate fast network call
      let list = [...this.fallbackProviders];
      if (params?.search) {
        const query = params.search.toLowerCase();
        list = list.filter(
          (p) =>
            p.businessName.toLowerCase().includes(query) ||
            p.servicesOffered.some((s) => s.toLowerCase().includes(query))
        );
      }
      return {
        success: true,
        statusCode: 200,
        data: list,
      };
    } catch (err: any) {
      return {
        success: false,
        statusCode: 500,
        error: err.message || 'Failed to load providers',
      };
    }
  }

  async fetchProviderById(id: string): Promise<ApiResponse<ServiceProvider>> {
    try {
      const provider = this.fallbackProviders.find((p) => p.id === id);
      if (!provider) {
        return {
          success: false,
          statusCode: 404,
          error: `Provider with ID '${id}' was not found.`,
        };
      }
      return {
        success: true,
        statusCode: 200,
        data: provider,
      };
    } catch (err: any) {
      return {
        success: false,
        statusCode: 500,
        error: err.message || 'Failed to fetch provider details',
      };
    }
  }
}

export const mobileProviderService = new MobileProviderService();
