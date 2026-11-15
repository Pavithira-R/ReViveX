/**
 * Member 1 – Problem reports: users send them, admins read and resolve them.
 * Prisma is mocked, so no database is needed to run these tests.
 */
import request from 'supertest';
import app from '../app';
import prisma from '../utils/prisma';
import { generateToken } from '../utils';

jest.mock('../utils/prisma', () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn() },
    problemReport: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  },
}));

const db = prisma as unknown as {
  user: { findUnique: jest.Mock };
  problemReport: Record<'create' | 'findMany' | 'findUnique' | 'update', jest.Mock>;
};

const owner = { id: 'user-1', name: 'Nimal Perera', email: 'nimal@example.com', role: 'ITEM_OWNER', isActive: true };
const admin = { id: 'admin-1', name: 'Admin', email: 'admin@example.com', role: 'ADMIN', isActive: true };

const tokenFor = (u: typeof owner) =>
  `Bearer ${generateToken({ id: u.id, role: u.role as 'ITEM_OWNER', email: u.email, name: u.name })}`;

const report = (overrides: Record<string, unknown> = {}) => ({
  id: 'r1',
  userId: owner.id,
  screen: 'PostItem',
  message: 'The photo button does nothing.',
  status: 'OPEN',
  resolvedAt: null,
  createdAt: new Date('2026-11-15T09:00:00Z'),
  user: { id: owner.id, name: owner.name, email: owner.email },
  ...overrides,
});

beforeEach(() => {
  jest.resetAllMocks();
  process.env.JWT_SECRET = 'test-secret-key-12345';
  db.user.findUnique.mockImplementation(({ where }: { where: { id: string } }) =>
    Promise.resolve([owner, admin].find((u) => u.id === where.id) ?? null)
  );
});

describe('POST /api/reports', () => {
  it('requires login', async () => {
    const res = await request(app).post('/api/reports').send({ message: 'Something broke' });
    expect(res.status).toBe(401);
  });

  it('saves the report with the screen the user was on', async () => {
    db.problemReport.create.mockResolvedValue(report());

    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', tokenFor(owner))
      .send({ message: '  The photo button does nothing.  ', screen: 'PostItem' });

    expect(res.status).toBe(201);
    expect(db.problemReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { userId: owner.id, message: 'The photo button does nothing.', screen: 'PostItem' },
      })
    );
    expect(res.body.data).toMatchObject({ status: 'OPEN', reporter: { name: owner.name } });
  });

  it.each([
    ['too short', 'bad'],
    ['too long', 'x'.repeat(1001)],
    ['missing', undefined],
  ])('rejects a %s description', async (_label, message) => {
    const res = await request(app).post('/api/reports').set('Authorization', tokenFor(owner)).send({ message });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(db.problemReport.create).not.toHaveBeenCalled();
  });
});

describe('admin report endpoints', () => {
  it('are forbidden for non-admins', async () => {
    const list = await request(app).get('/api/admin/reports').set('Authorization', tokenFor(owner));
    const resolve = await request(app).patch('/api/admin/reports/r1/resolve').set('Authorization', tokenFor(owner));

    expect(list.status).toBe(403);
    expect(resolve.status).toBe(403);
  });

  it('lists reports newest first, filtered by status', async () => {
    db.problemReport.findMany.mockResolvedValue([report()]);

    const res = await request(app).get('/api/admin/reports?status=OPEN').set('Authorization', tokenFor(admin));

    expect(res.status).toBe(200);
    expect(db.problemReport.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'OPEN' }, orderBy: { createdAt: 'desc' } })
    );
    expect(res.body.data[0]).toMatchObject({ message: 'The photo button does nothing.', screen: 'PostItem' });
  });

  it('rejects an unknown status filter', async () => {
    const res = await request(app).get('/api/admin/reports?status=LOST').set('Authorization', tokenFor(admin));
    expect(res.status).toBe(400);
  });

  it('marks a report as resolved', async () => {
    db.problemReport.findUnique.mockResolvedValue(report());
    db.problemReport.update.mockResolvedValue(report({ status: 'RESOLVED', resolvedAt: new Date() }));

    const res = await request(app).patch('/api/admin/reports/r1/resolve').set('Authorization', tokenFor(admin));

    expect(res.status).toBe(200);
    expect(db.problemReport.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'r1' }, data: { status: 'RESOLVED', resolvedAt: expect.any(Date) } })
    );
    expect(res.body.data.status).toBe('RESOLVED');
  });

  it('returns 404 for an unknown report', async () => {
    db.problemReport.findUnique.mockResolvedValue(null);

    const res = await request(app).patch('/api/admin/reports/nope/resolve').set('Authorization', tokenFor(admin));

    expect(res.status).toBe(404);
    expect(db.problemReport.update).not.toHaveBeenCalled();
  });
});
