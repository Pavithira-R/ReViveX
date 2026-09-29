// ============================================================================
// Member 4 - Service Provider Service (Phase 1)
// ============================================================================

import { ServiceProvider } from '../types';

export class ProviderService {
  private providers: ServiceProvider[] = [
    {
      id: 'prov_fixit_001',
      userId: 'usr_prov_001',
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
      createdAt: '2025-01-15T08:00:00.000Z',
      updatedAt: '2025-01-15T08:00:00.000Z',
    },
    {
      id: 'prov_eco_002',
      userId: 'usr_prov_002',
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
      createdAt: '2025-01-20T08:00:00.000Z',
      updatedAt: '2025-01-20T08:00:00.000Z',
    },
    {
      id: 'prov_gadget_003',
      userId: 'usr_prov_003',
      name: 'Marcus Vance',
      businessName: 'Vance Precision Gadgets',
      profileImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a',
      isVerified: false,
      description: 'Precision repairs for gaming consoles, controllers, vintage electronics, and drones.',
      servicesOffered: [
        'Console HDMI Port Fix',
        'Controller Drift Repair',
        'Drone Motor Diagnostics',
      ],
      availability: 'Tue - Sun: 11:00 AM - 8:00 PM',
      location: 'Midtown Plaza, Suite 3B, NY',
      distanceKm: 5.7,
      rating: 4.6,
      reviewCount: 42,
      startingPrice: 40.0,
      currency: 'USD',
      phoneNumber: '+1 (555) 345-6789',
      email: 'marcus@vancegadgets.test',
      createdAt: '2025-02-01T08:00:00.000Z',
      updatedAt: '2025-02-01T08:00:00.000Z',
    },
  ];

  async getAllProviders(filter?: { category?: string; search?: string }): Promise<ServiceProvider[]> {
    let result = [...this.providers];

    if (filter?.search) {
      const term = filter.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.businessName.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.servicesOffered.some((s) => s.toLowerCase().includes(term)) ||
          p.location.toLowerCase().includes(term)
      );
    }

    if (filter?.category) {
      const cat = filter.category.toLowerCase();
      result = result.filter((p) =>
        p.servicesOffered.some((s) => s.toLowerCase().includes(cat))
      );
    }

    return result;
  }

  async getProviderById(id: string): Promise<ServiceProvider | null> {
    const provider = this.providers.find((p) => p.id === id);
    return provider || null;
  }

  // Seed / helper method for testing
  async addProvider(provider: ServiceProvider): Promise<ServiceProvider> {
    this.providers.push(provider);
    return provider;
  }
}

export const providerService = new ProviderService();
