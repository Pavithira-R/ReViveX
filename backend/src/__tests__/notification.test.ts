/**
 * Member 6 – In-app notifications: notify(), the three endpoints, and the
 * notification sent when eco points are earned.
 * Prisma is mocked, so no database is needed to run these tests.
 */
import request from 'supertest';
import app from '../app';
import prisma from '../utils/prisma';
import { generateToken } from '../utils';
import { awardEcoPoints, notify } from '../services';

jest.mock('../utils/prisma', () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn() },
    ecoAction: { create: jest.fn() },
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

const db = prisma as unknown as {
  user: { findUnique: jest.Mock };
  ecoAction: { create: jest.Mock };
  notification: Record<
    'create' | 'findMany' | 'findUnique' | 'count' | 'update' | 'updateMany',
    jest.Mock
  >;
};

const owner = { id: 'user-1', name: 'Test Owner', email: 'owner@example.com', role: 'ITEM_OWNER', isActive: true };

const row = (overrides: Record<string, unknown> = {}) => ({
  id: 'n1',
  userId: owner.id,
  type: 'ECO',
  title: 'Eco points earned',
  message: '+30 points for recycling a device.',
  refId: 'r1',
  readAt: null,
  createdAt: new Date('2026-11-14T10:00:00Z'),
  ...overrides,
});

const auth = () =>
  `Bearer ${generateToken({ id: owner.id, role: 'ITEM_OWNER', email: owner.email, name: owner.name })}`;

beforeEach(() => {
  jest.resetAllMocks();
  process.env.JWT_SECRET = 'test-secret-key-12345';
  db.user.findUnique.mockResolvedValue(owner);
});

describe('notify()', () => {
  it('creates a notification for the user', async () => {
    db.notification.create.mockResolvedValue(row({ type: 'REPAIR', title: 'Repair completed' }));

    const result = await notify(owner.id, 'Repair completed', 'Your laptop is ready.', {
      type: 'REPAIR',
      refId: 'repair-1',
    });

    expect(db.notification.create).toHaveBeenCalledWith({
      data: {
        userId: owner.id,
        title: 'Repair completed',
        message: 'Your laptop is ready.',
        type: 'REPAIR',
        refId: 'repair-1',
      },
    });
    expect(result).toMatchObject({ title: 'Repair completed', isRead: false });
  });

  it('never throws, so a failed notification cannot break the caller', async () => {
    db.notification.create.mockRejectedValue(new Error('database down'));

    await expect(notify(owner.id, 'Title', 'Message')).resolves.toBeNull();
  });

  it('is sent when eco points are earned', async () => {
    db.ecoAction.create.mockResolvedValue({});
    db.notification.create.mockResolvedValue(row());

    await awardEcoPoints(owner.id, 'RECYCLE', 'r1');

    expect(db.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: owner.id,
        type: 'ECO',
        title: 'Eco points earned',
        message: '+30 points for recycling a device. About 7.5 kg CO2 saved.',
        refId: 'r1',
      }),
    });
  });
});

describe('GET /api/notifications', () => {
  it('requires login', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });

  it("returns the user's notifications newest first with the unread count", async () => {
    db.notification.findMany.mockResolvedValue([
      row(),
      row({ id: 'n0', readAt: new Date('2026-11-14T11:00:00Z') }),
    ]);
    db.notification.count.mockResolvedValue(1);

    const res = await request(app).get('/api/notifications').set('Authorization', auth());

    expect(res.status).toBe(200);
    expect(db.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: owner.id }, orderBy: { createdAt: 'desc' } })
    );
    expect(res.body.data.unreadCount).toBe(1);
    expect(res.body.data.items.map((n: { isRead: boolean }) => n.isRead)).toEqual([false, true]);
  });
});

describe('PATCH /api/notifications/:id/read', () => {
  it('marks the user’s own notification as read', async () => {
    db.notification.findUnique.mockResolvedValue(row());
    db.notification.update.mockResolvedValue(row({ readAt: new Date() }));

    const res = await request(app).patch('/api/notifications/n1/read').set('Authorization', auth());

    expect(res.status).toBe(200);
    expect(res.body.data.isRead).toBe(true);
  });

  it("returns 404 for someone else's notification", async () => {
    db.notification.findUnique.mockResolvedValue(row({ userId: 'someone-else' }));

    const res = await request(app).patch('/api/notifications/n1/read').set('Authorization', auth());

    expect(res.status).toBe(404);
    expect(db.notification.update).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/notifications/read-all', () => {
  it("marks all of the user's unread notifications as read", async () => {
    db.notification.updateMany.mockResolvedValue({ count: 3 });

    const res = await request(app).patch('/api/notifications/read-all').set('Authorization', auth());

    expect(res.status).toBe(200);
    expect(db.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: owner.id, readAt: null },
      data: { readAt: expect.any(Date) },
    });
    expect(res.body.data.updated).toBe(3);
  });
});
