// Member 2 – Item Management
import request from 'supertest';
import app from '../app';
import prisma from '../utils/prisma';
import { generateToken } from '../utils';
import { awardEcoPoints, notify } from '../services';

jest.mock('../utils/prisma', () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn() },
    category: { findUnique: jest.fn(), findMany: jest.fn() },
    item: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('../services', () => ({
  awardEcoPoints: jest.fn(),
  notify: jest.fn(),
}));

const db = prisma as unknown as {
  user: { findUnique: jest.Mock };
  category: { findUnique: jest.Mock; findMany: jest.Mock };
  item: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

const owner = {
  id: 'owner-1',
  name: 'Test Owner',
  email: 'owner@example.com',
  role: 'ITEM_OWNER' as const,
  isActive: true,
};
const category = { id: 'category-1', name: 'Laptops', description: null };
const item = {
  id: 'item-1',
  name: 'Laptop',
  brand: null,
  condition: 'WORKING',
  action: 'REUSE',
  description: null,
  location: null,
  status: 'POSTED',
  images: [],
  ownerId: owner.id,
  categoryId: category.id,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const tokenFor = (user = owner) =>
  generateToken({ id: user.id, role: user.role, email: user.email, name: user.name });

beforeEach(() => {
  jest.resetAllMocks();
  process.env.JWT_SECRET = 'test-secret-key-12345';
  db.user.findUnique.mockResolvedValue(owner);
});

describe('Item Management routes', () => {
  it('requires authentication to create an item', async () => {
    const response = await request(app).post('/api/items').send({});

    expect(response.status).toBe(401);
    expect(db.item.create).not.toHaveBeenCalled();
  });

  it('rejects missing required fields', async () => {
    const response = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send({ name: 'Laptop' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(db.item.create).not.toHaveBeenCalled();
  });

  it('creates an item for the authenticated owner', async () => {
    db.category.findUnique.mockResolvedValue(category);
    db.item.create.mockResolvedValue({ ...item, category, owner: { id: owner.id, name: owner.name } });

    const response = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send({ name: item.name, condition: item.condition, action: item.action, categoryId: category.id });

    expect(response.status).toBe(201);
    expect(db.item.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ ownerId: owner.id, categoryId: category.id }),
    }));
  });

  it('allows the owner to update an item', async () => {
    db.item.findUnique.mockResolvedValue(item);
    db.item.update.mockResolvedValue({ ...item, name: 'Updated laptop' });

    const response = await request(app)
      .put(`/api/items/${item.id}`)
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send({ name: 'Updated laptop' });

    expect(response.status).toBe(200);
    expect(db.item.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: item.id },
      data: { name: 'Updated laptop' },
    }));
  });

  it('awards eco points and notifies the owner when an item is completed', async () => {
    db.item.findUnique.mockResolvedValue(item);
    db.item.update.mockResolvedValue({ ...item, status: 'COMPLETED', category });

    const response = await request(app)
      .put(`/api/items/${item.id}`)
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send({ status: 'COMPLETED' });

    expect(response.status).toBe(200);
    expect(awardEcoPoints).toHaveBeenCalledWith(owner.id, 'REUSE', item.id, 'LAPTOP');
    expect(notify).toHaveBeenCalledWith(
      owner.id,
      'Item completed',
      '"Laptop" has been given another life.',
      { type: 'LISTING', refId: item.id }
    );
  });

  it('forbids another user from updating or deleting an item', async () => {
    const otherUser = { ...owner, id: 'owner-2', email: 'other@example.com' };
    db.user.findUnique.mockResolvedValue(otherUser);
    db.item.findUnique.mockResolvedValue(item);

    const updateResponse = await request(app)
      .put(`/api/items/${item.id}`)
      .set('Authorization', `Bearer ${tokenFor(otherUser)}`)
      .send({ name: 'Not yours' });
    const deleteResponse = await request(app)
      .delete(`/api/items/${item.id}`)
      .set('Authorization', `Bearer ${tokenFor(otherUser)}`);

    expect(updateResponse.status).toBe(403);
    expect(deleteResponse.status).toBe(403);
    expect(db.item.update).not.toHaveBeenCalled();
    expect(db.item.delete).not.toHaveBeenCalled();
  });

  it('passes category filters to the item query', async () => {
    db.item.findMany.mockResolvedValue([]);

    const response = await request(app)
      .get(`/api/items?categoryId=${category.id}`)
      .set('Authorization', `Bearer ${tokenFor()}`);

    expect(response.status).toBe(200);
    expect(db.item.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { categoryId: category.id },
    }));
  });

  it('lists only the authenticated user’s items', async () => {
    db.item.findMany.mockResolvedValue([item]);

    const response = await request(app)
      .get('/api/users/me/items')
      .set('Authorization', `Bearer ${tokenFor()}`);

    expect(response.status).toBe(200);
    expect(db.item.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { ownerId: owner.id },
    }));
  });
});