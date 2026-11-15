// ============================================================================
// Member 3 - Listing Integration Adapter (Member 5 Dependency)
// Interfaces with Member 5's Marketplace (Sell / Donate / Reuse) module without duplicating models.
// ============================================================================

import { NormalizedListing, ListingQueryParams } from './types';
import { calculateHaversineDistanceKm } from '../utils/distance';

/**
 * Normalizes a raw Member 5 listing (Sell, Donate, or Reuse) into a uniform Member 3 listing
 */
export function normalizeListing(
  raw: any,
  explicitType?: 'SELL' | 'DONATE' | 'REUSE'
): NormalizedListing {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid raw listing data provided to listingAdapter');
  }

  // Infer actionType if not provided explicitly
  let actionType: 'SELL' | 'DONATE' | 'REUSE' = explicitType || 'SELL';
  if (!explicitType) {
    if (raw.actionType) {
      actionType = String(raw.actionType).toUpperCase() as 'SELL' | 'DONATE' | 'REUSE';
    } else if (raw.organization) {
      actionType = 'DONATE';
    } else if (raw.price !== undefined && raw.price !== null) {
      actionType = 'SELL';
    } else {
      actionType = 'REUSE';
    }
  }

  return {
    id: String(raw.id),
    userId: String(raw.userId || 'usr_anonymous'),
    title: String(raw.title || raw.name || 'Untitled Circular Item'),
    description: String(raw.description || ''),
    category: String(raw.category || 'General Electronics'),
    condition: String(raw.condition || 'Used - Good'),
    actionType,
    price: typeof raw.price === 'number' ? raw.price : null,
    organization: raw.organization ? String(raw.organization) : null,
    imageUrl: raw.imageUrl ? String(raw.imageUrl) : null,
    location: raw.location ? String(raw.location) : null,
    latitude: typeof raw.latitude === 'number' ? raw.latitude : null,
    longitude: typeof raw.longitude === 'number' ? raw.longitude : null,
    distanceKm: typeof raw.distanceKm === 'number' ? raw.distanceKm : null,
    status: String(raw.status || 'AVAILABLE'),
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
    source: 'MEMBER_5_MARKETPLACE',
  };
}

/**
 * Seeded integration dataset matching Member 5's in-memory schema (active until branches merge)
 */
const SEEDED_MEMBER_5_SELL = [
  {
    id: 'sell_thinkpad_lk_01',
    userId: 'usr_seller_lk',
    title: 'Lenovo ThinkPad T480 - i7 / 16GB / 512GB SSD',
    description: '14-inch IPS, Intel i7 8th Gen, 16GB RAM, 512GB NVMe. Clean condition with original charger.',
    category: 'Laptops',
    condition: 'Optimal',
    price: 320.0,
    imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed',
    location: 'Colombo 03, Sri Lanka',
    latitude: 6.9271,
    longitude: 79.8612,
    status: 'AVAILABLE',
    createdAt: '2026-09-28T10:00:00.000Z',
  },
  {
    id: 'sell_macbook_01',
    userId: 'usr_seller_01',
    title: 'Apple MacBook Air M1 (2020)',
    description: '8GB Unified Memory, 256GB SSD, Space Gray. 92% battery cycle. Clean condition.',
    category: 'Laptops',
    condition: 'Like New',
    price: 550.0,
    imageUrl: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9',
    location: 'Downtown Tech District, NY',
    latitude: 40.7128,
    longitude: -74.006,
    status: 'AVAILABLE',
    createdAt: '2026-09-24T12:00:00.000Z',
  },
  {
    id: 'sell_headphone_02',
    userId: 'usr_seller_02',
    title: 'Sony WH-1000XM4 Noise Canceling Headphones',
    description: 'Black, original box and travel case included. Minor ear-pad wear, audio is pristine.',
    category: 'Audio',
    condition: 'Good',
    price: 130.0,
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b',
    location: 'Midtown Plaza, Suite 4, NY',
    latitude: 40.758,
    longitude: -73.9855,
    status: 'AVAILABLE',
    createdAt: '2026-09-26T09:30:00.000Z',
  },
];

const SEEDED_MEMBER_5_DONATE = [
  {
    id: 'don_tablet_01',
    userId: 'usr_donor_01',
    title: 'Samsung Galaxy Tab A8 for Underprivileged Students',
    description: 'Functional 10.5-inch tablet suitable for online schooling and reading.',
    category: 'Tablets',
    condition: 'Good',
    organization: 'City Youth Education Foundation',
    imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0',
    location: 'Westside Community Center, NY',
    latitude: 40.7306,
    longitude: -73.9352,
    status: 'AVAILABLE',
    createdAt: '2026-09-23T15:00:00.000Z',
  },
];

const SEEDED_MEMBER_5_REUSE = [
  {
    id: 'reuse_galaxy_01',
    userId: 'usr_reuser_01',
    title: 'Samsung Galaxy S9 (Repurposed Home Security Cam)',
    description: 'Old phone running IP Webcam software. Fully functional camera and WiFi. Free project kit.',
    category: 'Phones',
    condition: 'Working with minor wear',
    imageUrl: 'https://images.unsplash.com/photo-1580910051074-3eb694886505',
    location: 'Midtown East, NY',
    latitude: 40.7549,
    longitude: -73.984,
    status: 'AVAILABLE',
    createdAt: '2026-09-21T18:00:00.000Z',
  },
];

// Pluggable delegate hook for post-merge live integration
type ListingQueryDelegate = (params?: ListingQueryParams) => Promise<any[]>;
let externalQueryDelegate: ListingQueryDelegate | null = null;

export const ListingAdapter = {
  /**
   * Inject Member 5 HTTP client or service calls post-merge
   */
  setDelegate(queryFn: ListingQueryDelegate | null): void {
    externalQueryDelegate = queryFn;
  },

  /**
   * Retrieves listings across Sell, Donate, and Reuse domains with filtering, distance, and pagination
   */
  async queryListings(params?: ListingQueryParams): Promise<NormalizedListing[]> {
    if (externalQueryDelegate) {
      const rawList = await externalQueryDelegate(params);
      return rawList.map((item) => normalizeListing(item));
    }

    // Default integration stub pooling Member 5 listings
    let combined: NormalizedListing[] = [
      ...SEEDED_MEMBER_5_SELL.map((item) => normalizeListing(item, 'SELL')),
      ...SEEDED_MEMBER_5_DONATE.map((item) => normalizeListing(item, 'DONATE')),
      ...SEEDED_MEMBER_5_REUSE.map((item) => normalizeListing(item, 'REUSE')),
    ];

    if (params?.actionType && params.actionType !== 'ALL') {
      combined = combined.filter((l) => l.actionType === params.actionType);
    }

    if (params?.category) {
      const cat = params.category.toLowerCase();
      combined = combined.filter((l) => l.category.toLowerCase().includes(cat));
    }

    // Condition filter applied before pagination
    if (params?.condition) {
      const cond = params.condition.toLowerCase();
      combined = combined.filter((l) => {
        const lCond = l.condition.toLowerCase();
        if (lCond.includes(cond)) return true;
        if (
          (cond === 'working' || cond === 'working_normally') &&
          (lCond.includes('like new') || lCond.includes('good') || lCond.includes('working'))
        ) {
          return true;
        }
        if (
          (cond === 'damaged' || cond === 'working_with_problems') &&
          (lCond.includes('minor wear') || lCond.includes('damaged') || lCond.includes('problems'))
        ) {
          return true;
        }
        return false;
      });
    }

    if (params?.search) {
      const term = params.search.toLowerCase();
      combined = combined.filter(
        (l) =>
          l.title.toLowerCase().includes(term) ||
          l.description.toLowerCase().includes(term) ||
          l.category.toLowerCase().includes(term)
      );
    }

    if (params?.minPrice !== undefined && params.minPrice !== null) {
      combined = combined.filter((l) => l.price !== null && l.price !== undefined && l.price >= params.minPrice!);
    }

    if (params?.maxPrice !== undefined && params.maxPrice !== null) {
      combined = combined.filter((l) => l.price !== null && l.price !== undefined && l.price <= params.maxPrice!);
    }

    // Dynamic Haversine distance calculation
    const hasUserCoords =
      params?.latitude !== undefined &&
      params?.longitude !== undefined &&
      !isNaN(params.latitude) &&
      !isNaN(params.longitude);

    if (hasUserCoords) {
      combined = combined.map((l) => {
        const dist = calculateHaversineDistanceKm(
          params!.latitude!,
          params!.longitude!,
          l.latitude,
          l.longitude
        );
        return {
          ...l,
          distanceKm: dist,
        };
      });

      const maxDist = params?.radiusKm;
      if (maxDist !== undefined && maxDist !== null && maxDist > 0) {
        combined = combined.filter(
          (l) => l.distanceKm !== null && l.distanceKm !== undefined && l.distanceKm <= maxDist
        );
      }

      combined.sort((a, b) => {
        const hasA = a.distanceKm !== null && a.distanceKm !== undefined;
        const hasB = b.distanceKm !== null && b.distanceKm !== undefined;
        if (!hasA && !hasB) return 0;
        if (!hasA) return 1;
        if (!hasB) return -1;
        return a.distanceKm! - b.distanceKm!;
      });
    }

    // Apply pagination if page or limit explicitly requested
    if (params?.page !== undefined || params?.limit !== undefined) {
      const page = params.page && params.page > 0 ? params.page : 1;
      const limit = params.limit && params.limit > 0 ? params.limit : 20;
      const start = (page - 1) * limit;
      return combined.slice(start, start + limit);
    }

    return combined;
  },

  /**
   * Retrieves a single listing by ID and optional actionType
   */
  async getListingById(id: string): Promise<NormalizedListing | null> {
    const all = await this.queryListings();
    return all.find((l) => l.id === id) || null;
  },
};
