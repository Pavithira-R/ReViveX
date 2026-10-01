// ============================================================================
// Member 3 - Item Integration Adapter (Member 2 Dependency)
// Interfaces with Member 2's Item Management module without duplicating models or Prisma queries.
// ============================================================================

import { NormalizedItem, ItemQueryParams } from './types';

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
    ownerName: raw.owner?.name ? String(raw.owner.name) : undefined,
    ownerId: raw.ownerId ? String(raw.ownerId) : undefined,
    status: String(raw.status || 'POSTED'),
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
    source: 'MEMBER_2_ITEMS',
  };
}

/**
 * Seeded integration dataset matching Member 2's schema (used until branches merge into develop)
 */
const SEEDED_MEMBER_2_ITEMS = [
  {
    id: 'item_lenovo_001',
    name: 'Lenovo ThinkPad T480',
    brand: 'Lenovo',
    condition: 'WORKING',
    action: 'SELL',
    description: '14-inch business laptop, Intel i5 8th Gen, 16GB RAM, 512GB SSD. Perfect working order.',
    location: { city: 'Downtown Tech District', latitude: 40.7128, longitude: -74.006 },
    status: 'POSTED',
    images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed'],
    ownerId: 'usr_cust_001',
    categoryId: 'cat_laptops_01',
    category: { id: 'cat_laptops_01', name: 'Laptops' },
    owner: { id: 'usr_cust_001', name: 'Jane Doe' },
    createdAt: '2026-09-20T10:00:00.000Z',
  },
  {
    id: 'item_iphone_002',
    name: 'Apple iPhone 12 Pro',
    brand: 'Apple',
    condition: 'DAMAGED',
    action: 'REPAIR',
    description: 'Cracked front glass. Touch digitizer works normally. Battery health at 84%.',
    location: { city: 'Midtown East', latitude: 40.7549, longitude: -73.984 },
    status: 'POSTED',
    images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9'],
    ownerId: 'usr_cust_002',
    categoryId: 'cat_phones_02',
    category: { id: 'cat_phones_02', name: 'Mobile Phones' },
    owner: { id: 'usr_cust_002', name: 'Mark Vance' },
    createdAt: '2026-09-22T14:30:00.000Z',
  },
  {
    id: 'item_dell_003',
    name: 'Dell UltraSharp 24 Monitor',
    brand: 'Dell',
    condition: 'WORKING',
    action: 'DONATE',
    description: '24-inch 1080p IPS monitor with HDMI and DisplayPort. Free for schools or students.',
    location: { city: 'Westside Eco District', latitude: 40.7306, longitude: -73.9352 },
    status: 'POSTED',
    images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf'],
    ownerId: 'usr_cust_003',
    categoryId: 'cat_monitors_03',
    category: { id: 'cat_monitors_03', name: 'Monitors' },
    owner: { id: 'usr_cust_003', name: 'Samantha Green' },
    createdAt: '2026-09-25T08:15:00.000Z',
  },
];

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
   * Retrieves electronic items applying optional Member 2 filters
   */
  async queryItems(params?: ItemQueryParams): Promise<NormalizedItem[]> {
    if (externalQueryDelegate) {
      const rawList = await externalQueryDelegate(params);
      return rawList.map(normalizeItem);
    }

    // Default integration stub matching Member 2 query semantics
    let results = [...SEEDED_MEMBER_2_ITEMS];

    if (params?.search) {
      const q = params.search.toLowerCase();
      results = results.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.brand && i.brand.toLowerCase().includes(q)) ||
          i.description.toLowerCase().includes(q)
      );
    }

    if (params?.categoryId) {
      results = results.filter((i) => i.categoryId === params.categoryId);
    }

    if (params?.condition) {
      results = results.filter((i) => i.condition === params.condition);
    }

    if (params?.action) {
      results = results.filter((i) => i.action === params.action);
    }

    const page = params?.page && params.page > 0 ? params.page : 1;
    const limit = params?.limit && params.limit > 0 ? params.limit : 20;
    const start = (page - 1) * limit;

    return results.slice(start, start + limit).map(normalizeItem);
  },

  /**
   * Retrieves a single item by unique ID
   */
  async getItemById(id: string): Promise<NormalizedItem | null> {
    if (externalGetDelegate) {
      const raw = await externalGetDelegate(id);
      return raw ? normalizeItem(raw) : null;
    }

    const found = SEEDED_MEMBER_2_ITEMS.find((i) => i.id === id);
    return found ? normalizeItem(found) : null;
  },
};
