// ============================================================================
// Member 3 - Recycling Integration Adapter (Member 5 Dependency)
// Interfaces with Member 5's Recycling module without duplicating models.
// ============================================================================

import { NormalizedRecyclingRequest, RecyclingQueryParams } from './types';
import { calculateHaversineDistanceKm } from '../utils/distance';

/**
 * Normalizes a raw Member 5 recycling request record into Member 3's standardized shape
 */
export function normalizeRecyclingRequest(raw: any): NormalizedRecyclingRequest {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid raw recycling request provided to recyclingAdapter');
  }

  return {
    id: String(raw.id),
    userId: String(raw.userId || 'usr_anonymous'),
    itemType: String(raw.itemType || 'Mixed E-Waste'),
    description: String(raw.description || ''),
    quantity: typeof raw.quantity === 'number' ? raw.quantity : 1,
    pickupAddress: String(raw.pickupAddress || 'Local Drop-off Station'),
    pickupDate: raw.pickupDate ? String(raw.pickupDate) : null,
    latitude: typeof raw.latitude === 'number' ? raw.latitude : null,
    longitude: typeof raw.longitude === 'number' ? raw.longitude : null,
    distanceKm: typeof raw.distanceKm === 'number' ? raw.distanceKm : null,
    status: String(raw.status || 'PENDING'),
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
    source: 'MEMBER_5_RECYCLING',
  };
}

/**
 * Seeded integration dataset matching Member 5's in-memory schema (active until branches merge)
 */
const SEEDED_MEMBER_5_RECYCLING = [
  {
    id: 'recycle_kiosk_01',
    userId: 'usr_recycler_01',
    itemType: 'Lithium Battery Packs & Old Cellphones',
    description: 'Swollen laptop battery and two non-working button phones for safe hazardous disposal.',
    quantity: 3,
    pickupAddress: 'Metro E-Waste Drop Box #4, Central Boulevard',
    latitude: 40.7128,
    longitude: -74.006,
    pickupDate: '2026-10-05T09:00:00.000Z',
    status: 'SCHEDULED',
    createdAt: '2026-09-27T11:00:00.000Z',
  },
  {
    id: 'recycle_crt_02',
    userId: 'usr_recycler_02',
    itemType: 'CRT Monitor & Broken Laser Printer',
    description: 'Cracked CRT monitor and broken ink-leaking printer for plastic and copper salvage.',
    quantity: 2,
    pickupAddress: 'EcoHub Collection Depot, Westside Avenue',
    latitude: 40.7306,
    longitude: -73.9352,
    pickupDate: '2026-10-08T14:00:00.000Z',
    status: 'PENDING',
    createdAt: '2026-09-28T16:20:00.000Z',
  },
];

// Pluggable delegate hook for post-merge live integration
type RecyclingQueryDelegate = (params?: RecyclingQueryParams) => Promise<any[]>;
let externalQueryDelegate: RecyclingQueryDelegate | null = null;

export const RecyclingAdapter = {
  /**
   * Inject Member 5 HTTP client or service calls post-merge
   */
  setDelegate(queryFn: RecyclingQueryDelegate | null): void {
    externalQueryDelegate = queryFn;
  },

  /**
   * Retrieves recycling requests applying search, status, distance filters, and pagination
   */
  async queryRecyclingRequests(
    params?: RecyclingQueryParams
  ): Promise<NormalizedRecyclingRequest[]> {
    let results: NormalizedRecyclingRequest[];

    if (externalQueryDelegate) {
      const rawList = await externalQueryDelegate(params);
      results = rawList.map(normalizeRecyclingRequest);
    } else {
      results = SEEDED_MEMBER_5_RECYCLING.map(normalizeRecyclingRequest);
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      results = results.filter(
        (r) =>
          r.itemType.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.pickupAddress.toLowerCase().includes(q)
      );
    }

    if (params?.status) {
      results = results.filter((r) => r.status.toUpperCase() === params.status!.toUpperCase());
    }

    if (params?.userId) {
      results = results.filter((r) => r.userId === params.userId);
    }

    // Dynamic Haversine distance calculation
    const hasUserCoords =
      params?.latitude !== undefined &&
      params?.longitude !== undefined &&
      !isNaN(params.latitude) &&
      !isNaN(params.longitude);

    if (hasUserCoords) {
      results = results.map((r) => {
        const dist = calculateHaversineDistanceKm(
          params!.latitude!,
          params!.longitude!,
          r.latitude,
          r.longitude
        );
        return {
          ...r,
          distanceKm: dist,
        };
      });

      const maxDist = params?.radiusKm;
      if (maxDist !== undefined && maxDist !== null && maxDist > 0) {
        results = results.filter(
          (r) => r.distanceKm !== null && r.distanceKm !== undefined && r.distanceKm <= maxDist
        );
      }

      results.sort((a, b) => {
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
      return results.slice(start, start + limit);
    }

    return results;
  },

  /**
   * Retrieves a single recycling request by ID
   */
  async getRecyclingRequestById(id: string): Promise<NormalizedRecyclingRequest | null> {
    const all = await this.queryRecyclingRequests();
    return all.find((r) => r.id === id) || null;
  },
};
