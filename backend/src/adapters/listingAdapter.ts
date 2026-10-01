// ============================================================================
// Member 3 - Listing Integration Adapter (Member 5 Dependency)
// Interfaces with Member 5's Marketplace (Sell / Donate / Reuse) module without duplicating models.
// ============================================================================

import { NormalizedListing, ListingQueryParams } from './types';

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
    id: 'sell_macbook_01',
    userId: 'usr_seller_01',
    title: 'Apple MacBook Air M1 (2020)',
    description: '8GB Unified Memory, 256GB SSD, Space Gray. 92% battery cycle. Clean condition.',
    category: 'Laptops',
    condition: 'Like New',
    price: 550.0,
    imageUrl: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9',
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
   * Retrieves listings across Sell, Donate, and Reuse domains
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
