/**
 * Member 6 – Eco Impact: points, badges and GET /api/eco/me.
 * Prisma is mocked, so no database is needed to run these tests.
 */
import request from 'supertest';
import { Prisma } from '@prisma/client';
import app from '../app';
import prisma from '../utils/prisma';
import { generateToken } from '../utils';
import { awardEcoPoints, badgeFor, ECO_POINTS } from '../services';

jest.mock('../utils/prisma', () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn() },
    ecoAction: { create: jest.fn(), findMany: jest.fn() },
  },
}));

const db = prisma as unknown as {
  user: { findUnique: jest.Mock };
  ecoAction: { create: jest.Mock; findMany: jest.Mock };
};

const owner = {
  id: 'user-1',
  name: 'Test Owner',
  email: 'owner@example.com',
  role: 'ITEM_OWNER',
  isActive: true,
};

const action = (type: keyof typeof ECO_POINTS, refId: string, createdAt: string) => ({
  id: `eco-${refId}`,
  userId: owner.id,
  type,
  points: ECO_POINTS[type],
  refId,
  createdAt: new Date(createdAt),
});

beforeEach(() => {
  jest.resetAllMocks();
  process.env.JWT_SECRET = 'test-secret-key-12345';
  db.user.findUnique.mockResolvedValue(owner);
});

describe('awardEcoPoints', () => {
  it('records a completed activity with its points', async () => {
    db.ecoAction.create.mockResolvedValue({});

    const result = await awardEcoPoints(owner.id, 'RECYCLE', 'recycle-1');

    expect(result).toEqual({ awarded: true, points: 30 });
    expect(db.ecoAction.create).toHaveBeenCalledWith({
      data: { userId: owner.id, type: 'RECYCLE', points: 30, refId: 'recycle-1' },
    });
  });

  it('does not award points twice for the same activity', async () => {
    db.ecoAction.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      })
    );

    const result = await awardEcoPoints(owner.id, 'REPAIR', 'repair-1');

    expect(result).toEqual({ awarded: false, points: 0 });
  });

  it('rejects an unknown activity type', async () => {
    await expect(awardEcoPoints(owner.id, 'BURN' as never, 'x')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
    expect(db.ecoAction.create).not.toHaveBeenCalled();
  });
});

describe('badges', () => {
  it.each([
    [0, 'NONE'],
    [49, 'NONE'],
    [50, 'BRONZE'],
    [150, 'SILVER'],
    [300, 'GOLD'],
  ])('%i points → %s', (points, badge) => {
    expect(badgeFor(points)).toBe(badge);
  });
});

describe('GET /api/eco/me', () => {
  const token = () =>
    generateToken({ id: owner.id, role: 'ITEM_OWNER', email: owner.email, name: owner.name });

  it('requires login', async () => {
    const res = await request(app).get('/api/eco/me');
    expect(res.status).toBe(401);
  });

  it('returns totals, badge, next badge and counts for the signed-in user', async () => {
    db.ecoAction.findMany.mockResolvedValue([
      action('RECYCLE', 'r1', '2026-11-03T00:00:00Z'),
      action('DONATE', 'd1', '2026-11-02T00:00:00Z'),
      action('REPAIR', 'p1', '2026-11-01T00:00:00Z'),
    ]);

    const res = await request(app).get('/api/eco/me').set('Authorization', `Bearer ${token()}`);

    expect(res.status).toBe(200);
    expect(db.ecoAction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: owner.id } })
    );
    expect(res.body.data).toMatchObject({
      totalPoints: 75,
      badge: 'BRONZE',
      nextBadge: { badge: 'SILVER', pointsNeeded: 75 },
      counts: { REPAIR: 1, REUSE: 0, SELL: 0, DONATE: 1, RECYCLE: 1 },
    });
    expect(res.body.data.recent).toHaveLength(3);
  });

  it('returns zero points and no badge for a new user', async () => {
    db.ecoAction.findMany.mockResolvedValue([]);

    const res = await request(app).get('/api/eco/me').set('Authorization', `Bearer ${token()}`);

    expect(res.body.data).toMatchObject({
      totalPoints: 0,
      badge: 'NONE',
      nextBadge: { badge: 'BRONZE', pointsNeeded: 50 },
      recent: [],
    });
  });
});
