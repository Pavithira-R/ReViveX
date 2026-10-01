// ============================================================================
// Member 3 - Provider Integration Adapter (Member 4 Dependency)
// Interfaces with Member 4's Repair Service Provider module without duplicating models or CRUD.
// ============================================================================

import { NormalizedProvider, ProviderQueryParams } from './types';

/**
 * Normalizes a raw Member 4 ServiceProvider record into Member 3's standardized shape
 */
export function normalizeProvider(raw: any): NormalizedProvider {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid raw provider data provided to providerAdapter');
  }

  return {
    id: String(raw.id),
    name: String(raw.name || raw.technicianName || 'Certified Technician'),
    businessName: String(raw.businessName || raw.name || 'Repair Center'),
    description: String(raw.description || ''),
    servicesOffered: Array.isArray(raw.servicesOffered)
      ? raw.servicesOffered.map(String)
      : Array.isArray(raw.services)
      ? raw.services.map(String)
      : [],
    availability: String(raw.availability || 'Mon-Sat: 9:00 AM - 6:00 PM'),
    location: String(raw.location || 'Local Area'),
    distanceKm: typeof raw.distanceKm === 'number' ? raw.distanceKm : null,
    rating: typeof raw.rating === 'number' ? Number(raw.rating.toFixed(1)) : 5.0,
    reviewCount: typeof raw.reviewCount === 'number' ? raw.reviewCount : 0,
    startingPrice: typeof raw.startingPrice === 'number' ? raw.startingPrice : null,
    currency: String(raw.currency || 'USD'),
    isVerified: Boolean(raw.isVerified),
    profileImage: raw.profileImage ? String(raw.profileImage) : null,
    phoneNumber: raw.phoneNumber ? String(raw.phoneNumber) : null,
    email: raw.email ? String(raw.email) : null,
    source: 'MEMBER_4_REPAIR',
  };
}

/**
 * Seeded integration dataset matching Member 4's providerService (active until branches merge)
 */
const SEEDED_MEMBER_4_PROVIDERS = [
  {
    id: 'prov_fixit_001',
    name: 'Alex Tech Master',
    businessName: 'FixIt Pro Electronics',
    profileImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758',
    isVerified: true,
    description: 'Certified repair technician specializing in Apple MacBooks, iPhones, iPads, and high-end laptops. OEM parts and 90-day warranty.',
    servicesOffered: [
      'Screen Replacement',
      'Battery Replacement',
      'Motherboard Micro-soldering',
      'Water Damage Diagnostic',
      'Laptop Keyboard Repair',
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
    description: 'Eco-conscious electronics repair lab. We refurbish, repair and prolong gadget lifespans, diverting toxic e-waste.',
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
  {
    id: 'prov_gadget_003',
    name: 'Marcus Vance',
    businessName: 'Vance Precision Gadgets',
    profileImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a',
    isVerified: false,
    description: 'Precision repairs for gaming consoles, controllers, monitors, and vintage electronics.',
    servicesOffered: [
      'Console HDMI Port Fix',
      'Controller Drift Repair',
      'Monitor Power Supply Fix',
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
  },
];

// Pluggable delegates for post-merge live integration
type ProviderQueryDelegate = (filter?: { search?: string; category?: string }) => Promise<any[]>;
type ProviderGetDelegate = (id: string) => Promise<any | null>;

let externalQueryDelegate: ProviderQueryDelegate | null = null;
let externalGetDelegate: ProviderGetDelegate | null = null;

export const ProviderAdapter = {
  /**
   * Inject Member 4's providerService methods upon integration
   */
  setDelegates(queryFn: ProviderQueryDelegate | null, getFn: ProviderGetDelegate | null): void {
    externalQueryDelegate = queryFn;
    externalGetDelegate = getFn;
  },

  /**
   * Retrieves providers applying keyword, category, rating, and distance filters
   */
  async queryProviders(params?: ProviderQueryParams): Promise<NormalizedProvider[]> {
    let rawList: any[];

    if (externalQueryDelegate) {
      rawList = await externalQueryDelegate({
        search: params?.search,
        category: params?.category,
      });
    } else {
      // Default integration stub matching Member 4 query semantics
      rawList = [...SEEDED_MEMBER_4_PROVIDERS];

      if (params?.search) {
        const term = params.search.toLowerCase();
        rawList = rawList.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.businessName.toLowerCase().includes(term) ||
            p.description.toLowerCase().includes(term) ||
            p.servicesOffered.some((s: string) => s.toLowerCase().includes(term)) ||
            p.location.toLowerCase().includes(term)
        );
      }

      if (params?.category) {
        const cat = params.category.toLowerCase();
        rawList = rawList.filter((p) =>
          p.servicesOffered.some((s: string) => s.toLowerCase().includes(cat))
        );
      }
    }

    let normalized = rawList.map(normalizeProvider);

    // Apply Member 3 extra filters (minRating, maxDistanceKm)
    if (params?.minRating) {
      normalized = normalized.filter((p) => p.rating >= params.minRating!);
    }

    if (params?.maxDistanceKm !== undefined && params.maxDistanceKm !== null) {
      normalized = normalized.filter(
        (p) => p.distanceKm !== null && p.distanceKm !== undefined && p.distanceKm <= params.maxDistanceKm!
      );
    }

    return normalized;
  },

  /**
   * Retrieves a single service provider by ID
   */
  async getProviderById(id: string): Promise<NormalizedProvider | null> {
    if (externalGetDelegate) {
      const raw = await externalGetDelegate(id);
      return raw ? normalizeProvider(raw) : null;
    }

    const found = SEEDED_MEMBER_4_PROVIDERS.find((p) => p.id === id);
    return found ? normalizeProvider(found) : null;
  },
};
