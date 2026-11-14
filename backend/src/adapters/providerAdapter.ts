// ============================================================================
// Member 3 - Provider Integration Adapter (Member 4 Dependency)
// Interfaces with Member 4's Repair Service Provider module without duplicating models or CRUD.
// ============================================================================

import { NormalizedProvider, ProviderQueryParams } from './types';
import { calculateHaversineDistanceKm } from '../utils/distance';

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
    latitude: typeof raw.latitude === 'number' ? raw.latitude : null,
    longitude: typeof raw.longitude === 'number' ? raw.longitude : null,
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
    id: 'prov_colombo_004',
    name: 'Apex Tech Repair',
    businessName: 'Apex Tech Repair & Diagnostics',
    profileImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758',
    isVerified: true,
    description: 'Certified repair workshop in Colombo specializing in MacBook, iPhone, and Android micro-soldering.',
    servicesOffered: [
      'Screen Replacement',
      'Battery Replacement',
      'Motherboard Micro-soldering',
      'Laptop',
      'Phone',
    ],
    availability: 'Mon - Sat: 9:00 AM - 6:00 PM',
    location: '45 Galle Road, Colombo 03, Sri Lanka',
    latitude: 6.9271,
    longitude: 79.8612,
    rating: 4.9,
    reviewCount: 48,
    startingPrice: 25.0,
    currency: 'USD',
    phoneNumber: '+94 11 234 5678',
    email: 'info@apexrepair.lk',
  },
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
      'Laptop',
    ],
    availability: 'Mon - Sat: 9:00 AM - 6:00 PM',
    location: 'Downtown Tech Hub, 4th Avenue, NY',
    latitude: 40.7128,
    longitude: -74.006,
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
      'Phone',
    ],
    availability: 'Mon - Fri: 10:00 AM - 7:00 PM',
    location: 'Westside Eco District, Unit 12, NY',
    latitude: 40.7306,
    longitude: -73.9352,
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
      'Monitor',
    ],
    availability: 'Tue - Sun: 11:00 AM - 8:00 PM',
    location: 'Midtown Plaza, Suite 3B, NY',
    latitude: 40.7549,
    longitude: -73.984,
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
   * Retrieves providers applying keyword, category, rating, distance filters, and pagination
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
      rawList = [...SEEDED_MEMBER_4_PROVIDERS].map((p) => ({ ...p }));

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

    // Dynamic Haversine distance calculation if user coordinates supplied
    const hasUserCoords =
      params?.latitude !== undefined &&
      params?.longitude !== undefined &&
      !isNaN(params.latitude) &&
      !isNaN(params.longitude);

    if (hasUserCoords) {
      normalized = normalized.map((p) => {
        const dist = calculateHaversineDistanceKm(
          params!.latitude!,
          params!.longitude!,
          p.latitude,
          p.longitude
        );
        return {
          ...p,
          distanceKm: dist,
        };
      });

      // Sort by calculated distance ascending
      normalized.sort((a, b) => {
        const hasA = a.distanceKm !== null && a.distanceKm !== undefined;
        const hasB = b.distanceKm !== null && b.distanceKm !== undefined;
        if (!hasA && !hasB) return 0;
        if (!hasA) return 1;
        if (!hasB) return -1;
        return a.distanceKm! - b.distanceKm!;
      });
    }

    // Apply Member 3 extra filters (minRating, maxDistanceKm / radiusKm)
    if (params?.minRating !== undefined && params.minRating !== null) {
      normalized = normalized.filter((p) => p.rating >= params.minRating!);
    }

    const maxDist = params?.radiusKm ?? params?.maxDistanceKm;
    if (maxDist !== undefined && maxDist !== null && maxDist > 0) {
      normalized = normalized.filter(
        (p) => p.distanceKm !== null && p.distanceKm !== undefined && p.distanceKm <= maxDist
      );
    }

    // Apply pagination if page or limit explicitly requested
    if (params?.page !== undefined || params?.limit !== undefined) {
      const page = params.page && params.page > 0 ? params.page : 1;
      const limit = params.limit && params.limit > 0 ? params.limit : 20;
      const start = (page - 1) * limit;
      return normalized.slice(start, start + limit);
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
