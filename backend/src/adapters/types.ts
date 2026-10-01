// ============================================================================
// Member 3 - Integration Adapter Types
// Standardized internal representations for external data domains
// (Member 2 Items, Member 4 Providers, Member 5 Listings & Recycling)
// ============================================================================

/**
 * Standardized electronic item consumed from Member 2
 */
export interface NormalizedItem {
  id: string;
  name: string;
  brand?: string | null;
  categoryName: string;
  categoryId?: string;
  condition: 'WORKING' | 'DAMAGED' | 'BROKEN';
  action: 'REPAIR' | 'REUSE' | 'SELL' | 'DONATE' | 'RECYCLE';
  description?: string | null;
  images: string[];
  location?: {
    city?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    [key: string]: unknown;
  } | null;
  ownerName?: string;
  ownerId?: string;
  status: string;
  createdAt: string;
  source: 'MEMBER_2_ITEMS';
}

/**
 * Query filters supported by ItemAdapter when querying Member 2
 */
export interface ItemQueryParams {
  search?: string;
  categoryId?: string;
  condition?: 'WORKING' | 'DAMAGED' | 'BROKEN';
  action?: 'REPAIR' | 'REUSE' | 'SELL' | 'DONATE' | 'RECYCLE';
  page?: number;
  limit?: number;
}

/**
 * Standardized repair service provider consumed from Member 4
 */
export interface NormalizedProvider {
  id: string;
  name: string;
  businessName: string;
  description: string;
  servicesOffered: string[];
  availability: string;
  location: string;
  distanceKm?: number | null;
  rating: number;
  reviewCount: number;
  startingPrice?: number | null;
  currency: string;
  isVerified: boolean;
  profileImage?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  source: 'MEMBER_4_REPAIR';
}

/**
 * Query filters supported by ProviderAdapter when querying Member 4
 */
export interface ProviderQueryParams {
  search?: string;
  category?: string;
  minRating?: number;
  maxDistanceKm?: number;
}

/**
 * Standardized circular marketplace listing consumed from Member 5 (Sell, Donate, Reuse)
 */
export interface NormalizedListing {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  actionType: 'SELL' | 'DONATE' | 'REUSE';
  price?: number | null;
  organization?: string | null;
  imageUrl?: string | null;
  status: string;
  createdAt: string;
  source: 'MEMBER_5_MARKETPLACE';
}

/**
 * Query filters supported by ListingAdapter when querying Member 5
 */
export interface ListingQueryParams {
  actionType?: 'ALL' | 'SELL' | 'DONATE' | 'REUSE';
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Standardized e-waste recycling request consumed from Member 5
 */
export interface NormalizedRecyclingRequest {
  id: string;
  userId: string;
  itemType: string;
  description: string;
  quantity: number;
  pickupAddress: string;
  pickupDate?: string | null;
  status: string;
  createdAt: string;
  source: 'MEMBER_5_RECYCLING';
}

/**
 * Query filters supported by RecyclingAdapter when querying Member 5
 */
export interface RecyclingQueryParams {
  search?: string;
  status?: string;
  userId?: string;
}
