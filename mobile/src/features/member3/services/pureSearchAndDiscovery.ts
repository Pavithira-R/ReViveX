// ============================================================================
// Member 3 - Pure Array Filtering & Discovery Feed Aggregation Functions
// Prepared for Firestore data feeds (getDocs). Operates strictly on array inputs.
// ============================================================================

import {
  SearchFilters,
  LocationCoordinates,
  DiscoveryFeedData,
  HeroBannerData,
} from '../types';
import { calculateHaversineDistanceKm } from '../utils/location';

export const MOCK_HERO_BANNER: HeroBannerData = {
  id: 'banner_rec_01',
  title: 'Evaluate Your Old Tech in 60 Seconds',
  subtitle: 'Unsure whether to repair, sell, donate, or recycle? Take the 4-step wizard.',
  ctaAction: 'NAVIGATE_QUESTIONNAIRE',
  badgeText: '60s SMART GUIDE',
};

/**
 * Pure function: Filters array of items (Member 2 schema) by search criteria
 */
export function filterItems(items: any[], params: Partial<SearchFilters>): any[] {
  if (!Array.isArray(items)) return [];
  let results = [...items];

  // 1. Text keyword search
  if (params.query?.trim()) {
    const q = params.query.trim().toLowerCase();
    results = results.filter(
      (i) =>
        (i.name && String(i.name).toLowerCase().includes(q)) ||
        (i.brand && String(i.brand).toLowerCase().includes(q)) ||
        (i.description && String(i.description).toLowerCase().includes(q)) ||
        (i.categoryName && String(i.categoryName).toLowerCase().includes(q))
    );
  }

  // 2. Category filtering
  if (params.category) {
    const cat = params.category.toLowerCase();
    results = results.filter(
      (i) =>
        (i.categoryId && String(i.categoryId).toLowerCase() === cat) ||
        (i.categoryName && String(i.categoryName).toLowerCase().includes(cat)) ||
        (i.category && String(i.category).toLowerCase().includes(cat))
    );
  }

  // 3. Condition filtering
  if (params.condition) {
    const cond = String(params.condition).toUpperCase();
    results = results.filter(
      (i) => String(i.condition).toUpperCase() === cond
    );
  }

  // 4. Action filtering
  if (params.actionType && params.actionType !== 'ALL') {
    const act = String(params.actionType).toUpperCase();
    results = results.filter(
      (i) => String(i.action || i.actionType).toUpperCase() === act
    );
  }

  // 5. Proximity distance calculation & filtering
  if (
    typeof params.latitude === 'number' &&
    typeof params.longitude === 'number' &&
    !isNaN(params.latitude) &&
    !isNaN(params.longitude)
  ) {
    const userLat = params.latitude;
    const userLon = params.longitude;

    results = results.map((item) => {
      const lat = item.location?.latitude ?? item.latitude;
      const lon = item.location?.longitude ?? item.longitude;
      const dist = calculateHaversineDistanceKm(userLat, userLon, lat, lon);
      return {
        ...item,
        distanceKm: dist < Infinity ? dist : item.distanceKm ?? null,
      };
    });

    if (typeof params.radiusKm === 'number' && params.radiusKm > 0) {
      const rad = params.radiusKm;
      results = results.filter(
        (i) => i.distanceKm !== null && i.distanceKm !== undefined && i.distanceKm <= rad
      );
    }

    results.sort((a, b) => {
      const distA = a.distanceKm ?? 9999;
      const distB = b.distanceKm ?? 9999;
      return distA - distB;
    });
  }

  return results;
}

/**
 * Pure function: Ranks repair providers (Member 4 schema) by spatial distance & rating
 */
export function rankProvidersByDistance(
  providers: any[],
  userLocation?: LocationCoordinates | null,
  filters?: Partial<SearchFilters>
): any[] {
  if (!Array.isArray(providers)) return [];
  let results = [...providers];

  // 1. Text keyword search
  if (filters?.query?.trim()) {
    const q = filters.query.trim().toLowerCase();
    results = results.filter(
      (p) =>
        (p.businessName && String(p.businessName).toLowerCase().includes(q)) ||
        (p.name && String(p.name).toLowerCase().includes(q)) ||
        (Array.isArray(p.services) &&
          p.services.some((s: any) => String(s).toLowerCase().includes(q)))
    );
  }

  // 2. Minimum rating filter
  if (typeof filters?.minRating === 'number') {
    const minR = filters.minRating;
    results = results.filter((p) => (p.rating ?? 0) >= minR);
  }

  // 3. Proximity distance calculation & sorting
  const userLat = userLocation?.latitude ?? filters?.latitude;
  const userLon = userLocation?.longitude ?? filters?.longitude;

  if (typeof userLat === 'number' && typeof userLon === 'number' && !isNaN(userLat) && !isNaN(userLon)) {
    results = results.map((p) => {
      const lat = p.location?.latitude ?? p.latitude;
      const lon = p.location?.longitude ?? p.longitude;
      const dist = calculateHaversineDistanceKm(userLat, userLon, lat, lon);
      return {
        ...p,
        distanceKm: dist < Infinity ? dist : p.distanceKm ?? null,
      };
    });

    const radius = filters?.radiusKm;
    if (typeof radius === 'number' && radius > 0) {
      results = results.filter(
        (p) => p.distanceKm !== null && p.distanceKm !== undefined && p.distanceKm <= radius
      );
    }

    results.sort((a, b) => {
      const distA = a.distanceKm ?? 9999;
      const distB = b.distanceKm ?? 9999;
      if (distA !== distB) return distA - distB;
      return (b.rating ?? 0) - (a.rating ?? 0);
    });
  } else {
    // Fallback sort by rating descending
    results.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }

  return results;
}

/**
 * Pure function: Filters marketplace listings (Member 5 schema) by price, condition, actionType
 */
export function filterListings(listings: any[], params: Partial<SearchFilters>): any[] {
  if (!Array.isArray(listings)) return [];
  let results = [...listings];

  // 1. Text keyword search
  if (params.query?.trim()) {
    const q = params.query.trim().toLowerCase();
    results = results.filter(
      (l) =>
        (l.title && String(l.title).toLowerCase().includes(q)) ||
        (l.description && String(l.description).toLowerCase().includes(q)) ||
        (l.category && String(l.category).toLowerCase().includes(q))
    );
  }

  // 2. Action type filtering (SELL, DONATE, REUSE)
  if (params.actionType && params.actionType !== 'ALL') {
    const act = String(params.actionType).toUpperCase();
    results = results.filter(
      (l) => String(l.actionType || l.action).toUpperCase() === act
    );
  }

  // 3. Category filtering
  if (params.category) {
    const cat = params.category.toLowerCase();
    results = results.filter(
      (l) => l.category && String(l.category).toLowerCase().includes(cat)
    );
  }

  // 4. Condition filtering
  if (params.condition) {
    const cond = String(params.condition).toUpperCase();
    results = results.filter(
      (l) => String(l.condition).toUpperCase() === cond
    );
  }

  // 5. Price range filtering
  if (typeof params.minPrice === 'number') {
    const minP = params.minPrice;
    results = results.filter((l) => (l.price ?? 0) >= minP);
  }
  if (typeof params.maxPrice === 'number') {
    const maxP = params.maxPrice;
    results = results.filter((l) => (l.price ?? 0) <= maxP);
  }

  // 6. Proximity calculation
  if (
    typeof params.latitude === 'number' &&
    typeof params.longitude === 'number' &&
    !isNaN(params.latitude) &&
    !isNaN(params.longitude)
  ) {
    const userLat = params.latitude;
    const userLon = params.longitude;

    results = results.map((l) => {
      const lat = l.location?.latitude ?? l.latitude;
      const lon = l.location?.longitude ?? l.longitude;
      const dist = calculateHaversineDistanceKm(userLat, userLon, lat, lon);
      return {
        ...l,
        distanceKm: dist < Infinity ? dist : l.distanceKm ?? null,
      };
    });

    if (typeof params.radiusKm === 'number' && params.radiusKm > 0) {
      const rad = params.radiusKm;
      results = results.filter(
        (l) => l.distanceKm !== null && l.distanceKm !== undefined && l.distanceKm <= rad
      );
    }

    results.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
  }

  return results;
}

/**
 * Pure function: Filters e-waste recycling requests (Member 5 schema)
 */
export function filterRecyclingRequests(requests: any[], params: Partial<SearchFilters>): any[] {
  if (!Array.isArray(requests)) return [];
  let results = [...requests];

  if (params.query?.trim()) {
    const q = params.query.trim().toLowerCase();
    results = results.filter(
      (r) =>
        (r.itemType && String(r.itemType).toLowerCase().includes(q)) ||
        (r.pickupAddress && String(r.pickupAddress).toLowerCase().includes(q)) ||
        (r.name && String(r.name).toLowerCase().includes(q))
    );
  }

  if (
    typeof params.latitude === 'number' &&
    typeof params.longitude === 'number' &&
    !isNaN(params.latitude) &&
    !isNaN(params.longitude)
  ) {
    const userLat = params.latitude;
    const userLon = params.longitude;

    results = results.map((r) => {
      const lat = r.location?.latitude ?? r.latitude;
      const lon = r.location?.longitude ?? r.longitude;
      const dist = calculateHaversineDistanceKm(userLat, userLon, lat, lon);
      return {
        ...r,
        distanceKm: dist < Infinity ? dist : r.distanceKm ?? null,
      };
    });

    if (typeof params.radiusKm === 'number' && params.radiusKm > 0) {
      const rad = params.radiusKm;
      results = results.filter(
        (r) => r.distanceKm !== null && r.distanceKm !== undefined && r.distanceKm <= rad
      );
    }

    results.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
  }

  return results;
}

/**
 * Pure function: Builds the Discovery Feed structure using array inputs (fitted for Firestore getDocs)
 */
export function buildDiscoveryFeed(data: {
  items?: any[];
  listings?: any[];
  providers?: any[];
  recyclingRequests?: any[];
  userLocation?: LocationCoordinates | null;
  sectionLimit?: number;
}): DiscoveryFeedData {
  const limit = data.sectionLimit && data.sectionLimit > 0 ? data.sectionLimit : 4;

  // 1. Nearby Providers (Member 4)
  const nearbyProviders = rankProvidersByDistance(
    data.providers || [],
    data.userLocation
  ).slice(0, limit);

  // 2. Featured Listings (Member 5 - SELL or REUSE)
  const featuredListings = filterListings(data.listings || [], { actionType: 'ALL' })
    .filter((l) => l.actionType === 'SELL' || l.actionType === 'REUSE' || !l.actionType)
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, limit);

  // 3. Urgent Donations (Member 5 - DONATE)
  const urgentDonations = filterListings(data.listings || [], { actionType: 'DONATE' })
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, limit);

  // 4. E-Waste Drop-Off Kiosks (Member 5 - RECYCLING)
  const recyclingList = filterRecyclingRequests(data.recyclingRequests || [], {})
    .slice(0, 1);
  const nearestRecyclePoint = recyclingList[0] || null;

  // 5. Community Items (Member 2)
  const communityItems = filterItems(data.items || [], { actionType: 'ALL' })
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, limit);

  return {
    heroBanner: MOCK_HERO_BANNER,
    nearbyProviders,
    featuredListings,
    urgentDonations,
    nearestRecyclePoint,
    communityItems,
    sourceStatus: {
      providers: Array.isArray(data.providers) ? 'OK' : 'UNAVAILABLE',
      listings: Array.isArray(data.listings) ? 'OK' : 'UNAVAILABLE',
      recycling: Array.isArray(data.recyclingRequests) ? 'OK' : 'UNAVAILABLE',
      items: Array.isArray(data.items) ? 'OK' : 'UNAVAILABLE',
    },
  };
}
