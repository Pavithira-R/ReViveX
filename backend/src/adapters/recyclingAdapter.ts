// ============================================================================
// Member 3 - Recycling Integration Adapter (Member 5 Dependency)
// Interfaces with Member 5's Recycling module without duplicating models.
// ============================================================================

import { NormalizedRecyclingRequest, RecyclingQueryParams } from './types';

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
   * Retrieves recycling requests applying optional search / status filters
   */
  async queryRecyclingRequests(
    params?: RecyclingQueryParams
  ): Promise<NormalizedRecyclingRequest[]> {
    if (externalQueryDelegate) {
      const rawList = await externalQueryDelegate(params);
      return rawList.map(normalizeRecyclingRequest);
    }

    // Default integration stub matching Member 5 semantics
    let results = [...SEEDED_MEMBER_5_RECYCLING];

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

    return results.map(normalizeRecyclingRequest);
  },

  /**
   * Retrieves a single recycling request by ID
   */
  async getRecyclingRequestById(id: string): Promise<NormalizedRecyclingRequest | null> {
    const all = await this.queryRecyclingRequests();
    return all.find((r) => r.id === id) || null;
  },
};
