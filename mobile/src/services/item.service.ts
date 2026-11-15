// Member 2 – Item Management
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { fsCall, normalizeTimestamp, nowIso, withId } from './firebaseHelpers';
import { Category, CreateItemPayload, Item, ItemFilters } from '../types';

const itemCollection = collection(db, 'items');
const categoryCollection = collection(db, 'categories');

const getCurrentUserId = (): string => {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw new Error('Please sign in to manage items.');
  }
  return userId;
};

const normalizeItem = (raw: Record<string, unknown>, id: string): Item => {
  const item = raw ?? {};
  const createdAt = normalizeTimestamp(item.createdAt);
  const updatedAt = normalizeTimestamp(item.updatedAt ?? item.createdAt ?? createdAt);

  return {
    id,
    name: typeof item.name === 'string' ? item.name : '',
    brand: typeof item.brand === 'string' ? item.brand : null,
    condition: (typeof item.condition === 'string' ? item.condition : 'WORKING') as Item['condition'],
    action: (typeof item.action === 'string' ? item.action : 'REUSE') as Item['action'],
    description: typeof item.description === 'string' ? item.description : null,
    location: item.location && typeof item.location === 'object' ? (item.location as Record<string, unknown>) : null,
    status: (typeof item.status === 'string' ? item.status : 'POSTED') as Item['status'],
    images: Array.isArray(item.images)
      ? item.images.filter((image): image is string => typeof image === 'string')
      : [],
    ownerId: typeof item.ownerId === 'string' ? item.ownerId : '',
    categoryId: typeof item.categoryId === 'string' ? item.categoryId : '',
    category: item.category && typeof item.category === 'object' ? (item.category as Category) : undefined,
    owner: item.owner && typeof item.owner === 'object' ? (item.owner as Item['owner']) : undefined,
    createdAt,
    updatedAt,
  };
};

const applyFilters = (items: Item[], filters: ItemFilters = {}): Item[] => {
  const filtered = items.filter((item) => {
    if (filters.categoryId && item.categoryId !== filters.categoryId) return false;
    if (filters.condition && item.condition !== filters.condition) return false;
    if (filters.action && item.action !== filters.action) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (filters.search) {
      const haystack = `${item.name} ${item.brand ?? ''} ${item.description ?? ''}`.toLowerCase();
      if (!haystack.includes(filters.search.trim().toLowerCase())) return false;
    }
    return true;
  });

  filtered.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit && filters.limit > 0 ? filters.limit : filtered.length;
  const offset = (page - 1) * limit;

  return filtered.slice(offset, offset + limit);
};

const extractFormImages = (form: FormData): string[] => {
  const rawParts = (form as { _parts?: Array<[string, unknown]> })._parts ?? [];

  return rawParts
    .filter(([key]) => key === 'images' || key === 'image' || key === 'photo')
    .map(([, value]) => {
      if (typeof value === 'string') return value;
      if (value && typeof value === 'object' && 'uri' in value && typeof (value as { uri?: string }).uri === 'string') {
        return (value as { uri: string }).uri;
      }
      return null;
    })
    .filter((entry): entry is string => !!entry);
};

export const itemService = {
  categories: async (): Promise<Category[]> => {
    const snapshot = await fsCall(() => getDocs(categoryCollection));
    return snapshot.docs.map((document) => withId(document as any));
  },

  list: async (filters: ItemFilters = {}): Promise<Item[]> => {
    const snapshot = await fsCall(() => getDocs(itemCollection));
    const items = snapshot.docs.map((document) => normalizeItem(document.data() as Record<string, unknown>, document.id));
    return applyFilters(items, filters);
  },

  get: async (id: string): Promise<Item> => {
    const document = await fsCall(() => getDoc(doc(db, 'items', id)));
    if (!document.exists()) {
      throw new Error('Item not found.');
    }
    return normalizeItem(document.data() as Record<string, unknown>, document.id);
  },

  create: async (payload: CreateItemPayload): Promise<Item> => {
    const userId = getCurrentUserId();
    const now = nowIso();
    const item: Item = {
      id: '',
      name: payload.name,
      brand: payload.brand ?? null,
      condition: payload.condition,
      action: payload.action,
      description: payload.description ?? null,
      location: null,
      status: 'POSTED',
      images: [],
      ownerId: userId,
      categoryId: payload.categoryId,
      createdAt: now,
      updatedAt: now,
    };

    const created = await fsCall(() => addDoc(itemCollection, item));
    return {
      ...item,
      id: created.id,
      category: undefined,
      owner: undefined,
    };
  },

  update: async (id: string, payload: Partial<CreateItemPayload> & { status?: Item['status'] }): Promise<Item> => {
    const docReference = doc(db, 'items', id);
    const existing = await fsCall(() => getDoc(docReference));
    if (!existing.exists()) {
      throw new Error('Item not found.');
    }

    const next = {
      ...(existing.data() as Record<string, unknown>),
      ...payload,
      updatedAt: nowIso(),
    };

    await fsCall(() => updateDoc(docReference, next));
    return normalizeItem(next, id);
  },

  remove: async (id: string): Promise<{ id: string; deleted: boolean }> => {
    const document = doc(db, 'items', id);
    await fsCall(() => deleteDoc(document));
    return { id, deleted: true };
  },

  mine: async (): Promise<Item[]> => {
    const userId = getCurrentUserId();
    const snapshot = await fsCall(() => getDocs(itemCollection));
    return applyFilters(
      snapshot.docs
        .map((document) => normalizeItem(document.data() as Record<string, unknown>, document.id))
        .filter((item) => item.ownerId === userId),
      {}
    );
  },

  uploadImages: async (id: string, form: FormData): Promise<string[]> => {
    const images = extractFormImages(form);
    if (images.length === 0) {
      return [];
    }

    const itemReference = doc(db, 'items', id);
    const existing = await fsCall(() => getDoc(itemReference));
    if (!existing.exists()) {
      throw new Error('Item not found.');
    }

    const next = {
      ...(existing.data() as Record<string, unknown>),
      images,
      updatedAt: nowIso(),
    };

    await fsCall(() => updateDoc(itemReference, next));
    return images;
  },
};