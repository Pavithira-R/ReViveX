/**
 * Member 2 – Item Management on the fake Firestore: categories, owner/category names,
 * photos saved as Bytes, my items, filters and delete.
 */
import { ApiError, authService } from '../src/services';
import { DEFAULT_CATEGORIES, itemService } from '../src/services/item.service';

const { __fake } = require('../jest.firebase');

const owner = {
  id: 'user-1',
  name: 'Nimal Perera',
  email: 'nimal@example.com',
  role: 'ITEM_OWNER',
  phone: null,
  profileImage: null,
  latitude: 6.9271,
  longitude: 79.8612,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};
const other = { ...owner, id: 'user-2', name: 'Dilini Fernando', email: 'dilini@example.com', latitude: null, longitude: null };

const signInAs = (email: string) => authService.login({ email, password: 'Password123' });

const laptop = {
  name: 'ThinkPad T480',
  brand: 'Lenovo',
  condition: 'DAMAGED' as const,
  action: 'REPAIR' as const,
  description: 'Cracked screen',
  categoryId: 'laptop',
};

beforeEach(async () => {
  __fake.addAccount(owner, 'Password123');
  __fake.addAccount(other, 'Password123');
  await signInAs(owner.email);
});

test('categories: built-in list until admins add their own', async () => {
  expect(await itemService.categories()).toEqual(DEFAULT_CATEGORIES);

  __fake.setDoc('categories/drone', { name: 'Drone' });
  expect(await itemService.categories()).toEqual([{ id: 'drone', name: 'Drone' }]);
});

test('create saves owner and category names, and the owner location', async () => {
  const item = await itemService.create(laptop);

  expect(item).toMatchObject({ ownerName: 'Nimal Perera', categoryName: 'Laptop', status: 'POSTED' });
  expect(item.owner).toEqual({ id: 'user-1', name: 'Nimal Perera' });
  expect(__fake.getDoc(`items/${item.id}`)).toMatchObject({
    ownerId: 'user-1',
    ownerName: 'Nimal Perera',
    categoryId: 'laptop',
    categoryName: 'Laptop',
    location: { city: null, latitude: 6.9271, longitude: 79.8612 },
    photoCount: 0,
  });
});

test('photos are saved as bytes and come back as data URIs on the item', async () => {
  const item = await itemService.create(laptop);

  expect(await itemService.uploadPhotos(item.id, ['AAAA', 'BBBB'])).toBe(2);

  expect(__fake.docsIn(`items/${item.id}/photos`)).toHaveLength(2);
  expect(__fake.getDoc(`items/${item.id}`).photoCount).toBe(2);
  expect((await itemService.get(item.id)).images).toEqual([
    'data:image/jpeg;base64,AAAA',
    'data:image/jpeg;base64,BBBB',
  ]);
  // Lists stay light: no photos loaded.
  expect((await itemService.list())[0].images).toEqual([]);
});

test('a photo that is too large is refused', async () => {
  const item = await itemService.create(laptop);
  const error = await itemService.uploadPhotos(item.id, ['A'.repeat(700_001)]).catch((e: unknown) => e as ApiError);

  expect(error).toMatchObject({ code: 'PHOTO_TOO_LARGE' });
  expect(__fake.docsIn(`items/${item.id}/photos`)).toEqual([]);
});

test('my items only shows my own; browse filters by category and search', async () => {
  const mine = await itemService.create(laptop);
  await signInAs(other.email);
  await itemService.create({ ...laptop, name: 'Galaxy S10', categoryId: 'phone', action: 'SELL' });

  expect((await itemService.mine()).map((i) => i.name)).toEqual(['Galaxy S10']);
  expect((await itemService.list({ categoryId: 'laptop' })).map((i) => i.id)).toEqual([mine.id]);
  expect((await itemService.list({ search: 'galaxy' })).map((i) => i.name)).toEqual(['Galaxy S10']);
});

test('update keeps the category name in step; delete removes the photos too', async () => {
  const item = await itemService.create(laptop);
  await itemService.uploadPhotos(item.id, ['AAAA']);

  const updated = await itemService.update(item.id, { categoryId: 'tablet' });
  expect(updated.categoryName).toBe('Tablet');

  await itemService.remove(item.id);
  expect(__fake.getDoc(`items/${item.id}`)).toBeUndefined();
  expect(__fake.docsIn(`items/${item.id}/photos`)).toEqual([]);
  await expect(itemService.get(item.id)).rejects.toMatchObject({ code: 'NOT_FOUND' });
});

test('signed out: managing items asks to sign in', async () => {
  await authService.logout();
  await expect(itemService.create(laptop)).rejects.toMatchObject({ status: 401 });
});
