// Member 2 – Item Management (Cloud Firestore)
import {
  addDoc,
  Bytes,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { ApiError } from './api';
import { auth, db } from './firebase';
import { fsCall, normalizeTimestamp, nowIso, withId } from './firebaseHelpers';
import { Category, CreateItemPayload, Item, ItemFilters } from '../types';

const itemCollection = collection(db, 'items');
const categoryCollection = collection(db, 'categories');
const photosOf = (itemId: string) => collection(db, 'items', itemId, 'photos');

/** Up to 5 photos per item, each kept well under Firestore's 1 MB document limit. */
export const MAX_ITEM_PHOTOS = 5;
const MAX_PHOTO_BASE64_LENGTH = 700_000; // about 500 KB of JPEG

/**
 * Device categories. The ids match the eco impact device types (utils/eco.ts), so
 * awardEcoPoints(..., item.categoryName) gives the right CO2 estimate.
 * Admins can add more in the Firestore `categories` collection.
 */
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'phone', name: 'Phone' },
  { id: 'laptop', name: 'Laptop' },
  { id: 'tablet', name: 'Tablet' },
  { id: 'desktop', name: 'Desktop' },
  { id: 'monitor', name: 'Monitor' },
  { id: 'printer', name: 'Printer' },
  { id: 'headphones', name: 'Headphones' },
  { id: 'keyboard', name: 'Keyboard' },
  { id: 'camera', name: 'Camera' },
  { id: 'battery-charger', name: 'Battery charger' },
  { id: 'other', name: 'Other' },
];

const getCurrentUserId = (): string => {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw new ApiError('Please sign in to manage items.', 401, 'UNAUTHORIZED');
  }
  return userId;
};

const notFound = () => new ApiError('Item not found.', 404, 'NOT_FOUND');

const normalizeItem = (raw: Record<string, unknown>, id: string): Item => {
  const item = raw ?? {};
  const createdAt = normalizeTimestamp(item.createdAt);
  const updatedAt = normalizeTimestamp(item.updatedAt ?? item.createdAt ?? createdAt);
  const categoryId = typeof item.categoryId === 'string' ? item.categoryId : '';
  const ownerId = typeof item.ownerId === 'string' ? item.ownerId : '';

  return {
    id,
    name: typeof item.name === 'string' ? item.name : '',
    brand: typeof item.brand === 'string' ? item.brand : null,
    condition: (typeof item.condition === 'string' ? item.condition : 'WORKING') as Item['condition'],
    action: (typeof item.action === 'string' ? item.action : 'REUSE') as Item['action'],
    description: typeof item.description === 'string' ? item.description : null,
    location: item.location && typeof item.location === 'object' ? (item.location as Record<string, unknown>) : null,
    status: (typeof item.status === 'string' ? item.status : 'POSTED') as Item['status'],
    images: [],
    photoCount: typeof item.photoCount === 'number' ? item.photoCount : 0,
    ownerId,
    ownerName: typeof item.ownerName === 'string' ? item.ownerName : '',
    categoryId,
    categoryName: typeof item.categoryName === 'string' ? item.categoryName : '',
    category: categoryId
      ? { id: categoryId, name: typeof item.categoryName === 'string' ? item.categoryName : categoryId }
      : undefined,
    owner: ownerId
      ? { id: ownerId, name: typeof item.ownerName === 'string' && item.ownerName ? item.ownerName : 'Member' }
      : undefined,
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

const loadCategories = async (): Promise<Category[]> => {
  const snapshot = await getDocs(categoryCollection);
  const stored = snapshot.docs.map((document) => withId<Category>(document));
  return stored.length ? stored.sort((a, b) => a.name.localeCompare(b.name)) : DEFAULT_CATEGORIES;
};

const categoryNameOf = async (categoryId: string): Promise<string> =>
  (await loadCategories()).find((category) => category.id === categoryId)?.name ?? categoryId;

/** Photos of an item as `data:` URIs the Image component can show, in the order they were added. */
const loadPhotos = async (itemId: string): Promise<string[]> => {
  const snapshot = await getDocs(photosOf(itemId));
  return snapshot.docs
    .map((document) => document.data() as { jpeg: Bytes; order: number })
    .sort((a, b) => a.order - b.order)
    .map((photo) => `data:image/jpeg;base64,${photo.jpeg.toBase64()}`);
};

export const itemService = {
  categories: (): Promise<Category[]> => fsCall(loadCategories),

  /** All items (newest first), without photos so lists stay fast. */
  list: (filters: ItemFilters = {}): Promise<Item[]> =>
    fsCall(async () => {
      const snapshot = await getDocs(itemCollection);
      const items = snapshot.docs.map((document) => normalizeItem(document.data() as Record<string, unknown>, document.id));
      return applyFilters(items, filters);
    }),

  /** One item with its photos. */
  get: (id: string): Promise<Item> =>
    fsCall(async () => {
      const document = await getDoc(doc(db, 'items', id));
      if (!document.exists()) throw notFound();
      const item = normalizeItem(document.data() as Record<string, unknown>, document.id);
      return { ...item, images: item.photoCount ? await loadPhotos(id) : [] };
    }),

  create: (payload: CreateItemPayload): Promise<Item> =>
    fsCall(async () => {
      const userId = getCurrentUserId();
      const [owner, categoryName] = await Promise.all([
        getDoc(doc(db, 'users', userId)),
        categoryNameOf(payload.categoryId),
      ]);
      const profile = owner.data() ?? {};
      const hasLocation = typeof profile.latitude === 'number' && typeof profile.longitude === 'number';
      const now = nowIso();
      const data = {
        name: payload.name,
        brand: payload.brand ?? null,
        condition: payload.condition,
        action: payload.action,
        description: payload.description ?? null,
        location: hasLocation ? { city: null, latitude: profile.latitude, longitude: profile.longitude } : null,
        status: 'POSTED',
        photoCount: 0,
        ownerId: userId,
        ownerName: String(profile.name ?? ''),
        categoryId: payload.categoryId,
        categoryName,
        createdAt: now,
        updatedAt: now,
      };

      const created = await addDoc(itemCollection, data);
      return normalizeItem(data, created.id);
    }),

  update: (id: string, payload: Partial<CreateItemPayload> & { status?: Item['status'] }): Promise<Item> =>
    fsCall(async () => {
      const docReference = doc(db, 'items', id);
      const existing = await getDoc(docReference);
      if (!existing.exists()) throw notFound();

      const changes: Record<string, unknown> = { ...payload, updatedAt: nowIso() };
      if (payload.categoryId) changes.categoryName = await categoryNameOf(payload.categoryId);
      await updateDoc(docReference, changes);
      return normalizeItem({ ...(existing.data() as Record<string, unknown>), ...changes }, id);
    }),

  /** Deletes the item and its photos. */
  remove: (id: string): Promise<{ id: string; deleted: boolean }> =>
    fsCall(async () => {
      const photos = await getDocs(photosOf(id));
      if (!photos.empty) {
        const batch = writeBatch(db);
        photos.docs.forEach((photo) => batch.delete(photo.ref));
        await batch.commit();
      }
      await deleteDoc(doc(db, 'items', id));
      return { id, deleted: true };
    }),

  mine: (): Promise<Item[]> =>
    fsCall(async () => {
      const userId = getCurrentUserId();
      const snapshot = await getDocs(query(itemCollection, where('ownerId', '==', userId)));
      return applyFilters(
        snapshot.docs.map((document) => normalizeItem(document.data() as Record<string, unknown>, document.id))
      );
    }),

  /**
   * Saves photos in Firestore (Firebase Storage needs a paid plan): each JPEG, taken small by
   * the picker (base64), is stored as Bytes in `items/{id}/photos/{n}`. Replaces earlier photos.
   */
  uploadPhotos: (id: string, base64Photos: string[]): Promise<number> =>
    fsCall(async () => {
      const photos = base64Photos.filter(Boolean).slice(0, MAX_ITEM_PHOTOS);
      if (photos.some((photo) => photo.length > MAX_PHOTO_BASE64_LENGTH)) {
        throw new ApiError('A photo is too large. Please choose a smaller one.', 400, 'PHOTO_TOO_LARGE');
      }
      const existing = await getDocs(photosOf(id));
      const batch = writeBatch(db);
      existing.docs.forEach((photo) => batch.delete(photo.ref));
      await batch.commit();
      for (const [order, base64] of photos.entries()) {
        await setDoc(doc(db, 'items', id, 'photos', `photo-${order + 1}`), {
          jpeg: Bytes.fromBase64String(base64),
          order,
          updatedAt: nowIso(),
        });
      }
      await updateDoc(doc(db, 'items', id), { photoCount: photos.length, updatedAt: nowIso() });
      return photos.length;
    }),
};
