// ============================================================================
// Member 3 - Item Integration Adapter (Member 2 Dependency)
// Interfaces with Member 2's Item Management module without duplicating models or Prisma queries.
// ============================================================================

import { NormalizedItem, ItemQueryParams } from './types';
import { calculateHaversineDistanceKm } from '../utils/distance';

/**
 * Maps Member 3 questionnaire/discovery condition enums to Member 2's condition strings
 */
export function mapToMember2Condition(
  condition?: string
): 'WORKING' | 'DAMAGED' | 'BROKEN' | undefined {
  if (!condition) return undefined;
  const upper = condition.toUpperCase().trim();
  if (upper === 'WORKING_NORMALLY' || upper === 'WORKING') return 'WORKING';
  if (upper === 'WORKING_WITH_PROBLEMS' || upper === 'DAMAGED') return 'DAMAGED';
  if (upper === 'NOT_WORKING' || upper === 'PHYSICALLY_DAMAGED' || upper === 'BROKEN')
    return 'BROKEN';
  return undefined;
}

/**
 * Normalizes a raw Member 2 Item record into Member 3's standardized domain shape
 */
export function normalizeItem(raw: any): NormalizedItem {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid raw item data provided to itemAdapter');
  }

  return {
    id: String(raw.id),
    name: String(raw.name || raw.title || 'Untitled Electronic Device'),
    brand: raw.brand ? String(raw.brand) : null,
    categoryName: raw.category?.name
      ? String(raw.category.name)
      : typeof raw.category === 'string'
      ? raw.category
      : 'General Electronics',
    categoryId: raw.categoryId ? String(raw.categoryId) : undefined,
    condition: (['WORKING', 'DAMAGED', 'BROKEN'].includes(String(raw.condition).toUpperCase())
      ? String(raw.condition).toUpperCase()
      : 'WORKING') as 'WORKING' | 'DAMAGED' | 'BROKEN',
    action: (['REPAIR', 'REUSE', 'SELL', 'DONATE', 'RECYCLE'].includes(
      String(raw.action).toUpperCase()
    )
      ? String(raw.action).toUpperCase()
      : 'REUSE') as 'REPAIR' | 'REUSE' | 'SELL' | 'DONATE' | 'RECYCLE',
    description: raw.description ? String(raw.description) : null,
    images: Array.isArray(raw.images)
      ? raw.images.map(String)
      : raw.imageUrl
      ? [String(raw.imageUrl)]
      : [],
    location: raw.location && typeof raw.location === 'object' ? raw.location : null,
    distanceKm: typeof raw.distanceKm === 'number' ? raw.distanceKm : null,
    ownerName: raw.owner?.name ? String(raw.owner.name) : undefined,
    ownerId: raw.ownerId ? String(raw.ownerId) : undefined,
    status: String(raw.status || 'POSTED'),
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
    source: 'MEMBER_2_ITEMS',
  };
}

// Pluggable delegate hook for post-merge live integration
type ItemQueryDelegate = (params?: ItemQueryParams) => Promise<any[]>;
type ItemGetDelegate = (id: string) => Promise<any | null>;

let externalQueryDelegate: ItemQueryDelegate | null = null;
let externalGetDelegate: ItemGetDelegate | null = null;

export const ItemAdapter = {
  /**
   * Inject real Member 2 service or HTTP handler post-integration
   */
  setDelegates(queryFn: ItemQueryDelegate | null, getFn: ItemGetDelegate | null): void {
    externalQueryDelegate = queryFn;
    externalGetDelegate = getFn;
  },

  /**
   * Retrieves electronic items applying Member 2 filters and geographic distance calculation
   * Queries real database via delegate. Returns [] if no items exist or delegate is unset.
   */
  async queryItems(params?: ItemQueryParams): Promise<NormalizedItem[]> {
    let results: NormalizedItem[] = [];

    if (externalQueryDelegate) {
      const rawList = await externalQueryDelegate(params);
      if (Array.isArray(rawList)) {
        results = rawList.map(normalizeItem);
      }
    }

    // 1. Text keyword search
    if (params?.search && results.length > 0) {
      const q = params.search.toLowerCase();
      results = results.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.brand && i.brand.toLowerCase().includes(q)) ||
          (i.description && i.description.toLowerCase().includes(q))
      );
    }

    // 2. Category name filtering (before pagination)
    if (params?.category && results.length > 0) {
      const cat = params.category.toLowerCase();
      results = results.filter(
        (i) =>
          i.categoryName.toLowerCase().includes(cat) ||
          i.name.toLowerCase().includes(cat)
      );
    }

    // 3. Category ID filtering
    if (params?.categoryId && results.length > 0) {
      results = results.filter((i) => i.categoryId === params.categoryId);
    }

    // 4. Condition filtering
    if (params?.condition && results.length > 0) {
      results = results.filter((i) => i.condition === params.condition);
    }

    // 5. Action filtering
    if (params?.action && results.length > 0) {
      results = results.filter((i) => i.action === params.action);
    }

    // 6. GPS Haversine Distance calculation & filtering
    const hasUserCoords =
      params?.latitude !== undefined &&
      params?.longitude !== undefined &&
      !isNaN(params.latitude) &&
      !isNaN(params.longitude);

    if (hasUserCoords && results.length > 0) {
      results = results.map((item) => {
        const itemLat = item.location?.latitude;
        const itemLon = item.location?.longitude;
        const dist = calculateHaversineDistanceKm(
          params!.latitude!,
          params!.longitude!,
          itemLat,
          itemLon
        );
        return {
          ...item,
          distanceKm: dist,
        };
      });

      // Filter by radius if provided
      const effectiveRadius = params?.radiusKm;
      if (effectiveRadius !== undefined && effectiveRadius > 0) {
        results = results.filter(
          (item) =>
            item.distanceKm !== null &&
            item.distanceKm !== undefined &&
            item.distanceKm <= effectiveRadius
        );
      }

      // Sort by distance ascending (nearest first)
      results.sort((a, b) => {
        const hasA = a.distanceKm !== null && a.distanceKm !== undefined;
        const hasB = b.distanceKm !== null && b.distanceKm !== undefined;
        if (!hasA && !hasB) return 0;
        if (!hasA) return 1;
        if (!hasB) return -1;
        return a.distanceKm! - b.distanceKm!;
      });
    }

    // 7. Pagination (only applied if page or limit explicitly requested)
    if ((params?.page !== undefined || params?.limit !== undefined) && results.length > 0) {
      const page = params.page && params.page > 0 ? params.page : 1;
      const limit = params.limit && params.limit > 0 ? params.limit : 20;
      const start = (page - 1) * limit;
      return results.slice(start, start + limit);
    }

    return results;
  },

  /**
   * Retrieves a single item by unique ID from database
   */
  async getItemById(id: string): Promise<NormalizedItem | null> {
    if (externalGetDelegate) {
      const raw = await externalGetDelegate(id);
      return raw ? normalizeItem(raw) : null;
    }

    return null;
  },
};
