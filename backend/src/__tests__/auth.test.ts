/**
 * Member 1 – Authentication & User Management test suite.
 * IDs in test names map to the Testing Plan (TC-AUTH-xx, TC-API-xx) and User Stories (US-xx).
 * Prisma is mocked, so no database is needed to run these tests.
 */
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import app from '../app';
import prisma from '../utils/prisma';
import { hashPassword, comparePassword, generateToken, verifyToken } from '../utils';
import { AuthUser, UserRole } from '../types';

jest.mock('../utils/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const db = prisma.user as unknown as Record<
  'findUnique' | 'create' | 'update' | 'count' | 'findMany',
  jest.Mock
>;

const makeUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-1',
  name: 'Test Owner',
  email: 'owner@example.com',
  passwordHash: '$2a$10$placeholderhashplaceholderhashplaceholderhash',
  role: 'ITEM_OWNER',
  phone: null,
  profileImage: null,
  latitude: null,
  longitude: null,
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
});

/** Register users the `authenticate` middleware can look up by id. */
const givenUsers = (...users: ReturnType<typeof makeUser>[]) => {
  db.findUnique.mockImplementation(({ where }: { where: { id?: string; email?: string } }) =>
    Promise.resolve(
      users.find((u) => (where.id ? u.id === where.id : u.email === where.email)) ?? null
    )
  );
};

const tokenFor = (user: ReturnType<typeof makeUser>) =>
  generateToken({
    id: user.id,
    role: user.role as UserRole,
    email: user.email,
    name: user.name,
  });

const expectErrorEnvelope = (body: any, code: string) => {
  expect(body.success).toBe(false);
  expect(body.data).toBeNull();
  expect(body.error.code).toBe(code);
};

beforeEach(() => {
  jest.resetAllMocks();
  process.env.JWT_SECRET = 'test-secret-key-12345';
  process.env.JWT_EXPIRES_IN = '1h';
});

// =====================================================================
// Utilities
// =====================================================================
describe('Password & JWT utilities', () => {
  it('hashes passwords and never stores plaintext', async () => {
    const hash = await hashPassword('Password123');
    expect(hash).not.toBe('Password123');
    expect(await comparePassword('Password123', hash)).toBe(true);
    expect(await comparePassword('WrongPass1', hash)).toBe(false);
  });

  it('round-trips a token to the same user', () => {
    const user: AuthUser = { id: 'u1', role: 'BUYER', email: 'b@x.com', name: 'B' };
    expect(verifyToken(generateToken(user))).toEqual(user);
  });
});

// =====================================================================
// Registration – US-01
// =====================================================================
describe('POST /api/auth/register (US-01)', () => {
  it('TC-AUTH-01 / TC-API-01: valid data creates account, returns 201 + token + safe user', async () => {
    db.findUnique.mockResolvedValue(null);
    db.create.mockImplementation(({ data }) => Promise.resolve(makeUser({ ...data })));

    const res = await request(app).post('/api/auth/register').send({
      name: '  Test Owner ',
      email: 'Owner@Example.com',
      password: 'Password123',
      role: 'ITEM_OWNER',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({
      name: 'Test Owner',
      email: 'owner@example.com',
      role: 'ITEM_OWNER',
    });
    expect(res.body.data.user.passwordHash).toBeUndefined();

    const saved = db.create.mock.calls[0][0].data;
    expect(saved.passwordHash).not.toBe('Password123');
    expect(await comparePassword('Password123', saved.passwordHash)).toBe(true);
  });

  it('defaults role to ITEM_OWNER when none is chosen', async () => {
    db.findUnique.mockResolvedValue(null);
    db.create.mockImplementation(({ data }) => Promise.resolve(makeUser({ ...data })));

    await request(app)
      .post('/api/auth/register')
      .send({ name: 'A', email: 'a@example.com', password: 'Password123' });

    expect(db.create.mock.calls[0][0].data.role).toBe('ITEM_OWNER');
  });

  it('TC-AUTH-02: duplicate email returns 409', async () => {
    db.findUnique.mockResolvedValue(makeUser());

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Dup', email: 'owner@example.com', password: 'Password123' });

    expect(res.status).toBe(409);
    expectErrorEnvelope(res.body, 'EMAIL_TAKEN');
    expect(db.create).not.toHaveBeenCalled();
  });

  it('TC-AUTH-02: concurrent duplicate (DB unique violation) also returns 409', async () => {
    db.findUnique.mockResolvedValue(null);
    db.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      })
    );

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Dup', email: 'owner@example.com', password: 'Password123' });

    expect(res.status).toBe(409);
  });

  it('TC-AUTH-03: invalid email is rejected', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'X', email: 'not-an-email', password: 'Password123' });

    expect(res.status).toBe(400);
    expectErrorEnvelope(res.body, 'VALIDATION_ERROR');
    expect(res.body.error.details).toContain('A valid email address is required');
  });

  it('TC-AUTH-04: missing required fields are rejected and nothing is created', async () => {
    const res = await request(app).post('/api/auth/register').send({});

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual(
      expect.arrayContaining(['Name is required', 'Password is required'])
    );
    expect(db.create).not.toHaveBeenCalled();
  });

  it('rejects weak passwords', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'X', email: 'x@example.com', password: 'short' });

    expect(res.status).toBe(400);
  });

  it('blocks self-registration as ADMIN', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'X', email: 'x@example.com', password: 'Password123', role: 'ADMIN' });

    expect(res.status).toBe(400);
    expect(db.create).not.toHaveBeenCalled();
  });

  it('rejects an unknown role', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'X', email: 'x@example.com', password: 'Password123', role: 'HACKER' });

    expect(res.status).toBe(400);
  });

  it('returns 400 (not 500) for malformed JSON', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{"name": ');

    expect(res.status).toBe(400);
    expectErrorEnvelope(res.body, 'INVALID_JSON');
  });
});

// =====================================================================
// Login – US-02
// =====================================================================
describe('POST /api/auth/login (US-02)', () => {
  it('TC-AUTH-05: valid credentials return a token and user', async () => {
    const user = makeUser({ passwordHash: await hashPassword('Password123') });
    givenUsers(user);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'OWNER@example.com', password: 'Password123' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe('user-1');
    expect(verifyToken(res.body.data.token).id).toBe('user-1');
  });

  it('TC-AUTH-06 / TC-API-02: wrong password returns 401', async () => {
    givenUsers(makeUser({ passwordHash: await hashPassword('Password123') }));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@example.com', password: 'WrongPass99' });

    expect(res.status).toBe(401);
    expectErrorEnvelope(res.body, 'INVALID_CREDENTIALS');
  });

  it('unknown email gives the same 401 message (no account enumeration)', async () => {
    givenUsers();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'Password123' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('deactivated accounts cannot log in', async () => {
    givenUsers(makeUser({ passwordHash: await hashPassword('Password123'), isActive: false }));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@example.com', password: 'Password123' });

    expect(res.status).toBe(403);
    expectErrorEnvelope(res.body, 'ACCOUNT_DEACTIVATED');
  });

  it('missing fields return 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'owner@example.com' });
    expect(res.status).toBe(400);
  });
});

// =====================================================================
// Protected access – US-04
// =====================================================================
describe('authenticate middleware (US-04)', () => {
  it('TC-AUTH-07 / TC-API-03: no token returns 401 and no data', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
    expectErrorEnvelope(res.body, 'UNAUTHORIZED');
  });

  it('TC-AUTH-08: invalid token returns 401', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer not.a.real.token');
    expect(res.status).toBe(401);
  });

  it('TC-AUTH-08: expired token returns 401 with expiry message', async () => {
    const expired = jwt.sign(
      { sub: 'user-1', role: 'ITEM_OWNER', email: 'owner@example.com', name: 'T' },
      'test-secret-key-12345',
      { expiresIn: -10 }
    );
    const res = await request(app).get('/api/users/me').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Authentication token has expired');
  });

  it('token signed with a different secret is rejected', async () => {
    const forged = jwt.sign({ sub: 'user-1', role: 'ADMIN' }, 'attacker-secret');
    const res = await request(app).get('/api/users/me').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  it('wrong header scheme is rejected', async () => {
    const res = await request(app).get('/api/users/me').set('Authorization', 'Token abc');
    expect(res.status).toBe(401);
  });

  it('token for a deleted user is rejected', async () => {
    givenUsers();
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${tokenFor(makeUser())}`);
    expect(res.status).toBe(401);
  });

  it('token for a deactivated user is rejected immediately', async () => {
    const user = makeUser({ isActive: false });
    givenUsers(user);
    const res = await request(app).get('/api/users/me').set('Authorization', `Bearer ${tokenFor(user)}`);
    expect(res.status).toBe(403);
  });

  it('uses the current DB role, not the role stored in an old token', async () => {
    // Token says ADMIN, but the admin was demoted since it was issued.
    const demoted = makeUser({ role: 'BUYER' });
    givenUsers(demoted);
    const staleToken = tokenFor({ ...demoted, role: 'ADMIN' });

    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${staleToken}`);
    expect(res.status).toBe(403);
  });

  it('TC-AUTH-09: logout succeeds for an authenticated user', async () => {
    const user = makeUser();
    givenUsers(user);
    const res = await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${tokenFor(user)}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// =====================================================================
// Profile – US-03
// =====================================================================
describe('Profile endpoints (US-03)', () => {
  it('GET /api/users/me returns own profile without password hash', async () => {
    const user = makeUser({ phone: '+94771234567' });
    givenUsers(user);

    const res = await request(app).get('/api/users/me').set('Authorization', `Bearer ${tokenFor(user)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: 'user-1', email: 'owner@example.com', phone: '+94771234567' });
    expect(res.body.data.passwordHash).toBeUndefined();
  });

  it('GET /api/auth/me still works as an alias', async () => {
    const user = makeUser();
    givenUsers(user);
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${tokenFor(user)}`);
    expect(res.status).toBe(200);
  });

  it('PUT /api/users/me updates allowed fields and persists them', async () => {
    const user = makeUser();
    givenUsers(user);
    db.update.mockImplementation(({ data }) => Promise.resolve({ ...user, ...data }));

    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${tokenFor(user)}`)
      .send({ name: ' New Name ', phone: '+94 77 123 4567', latitude: 6.9, longitude: 79.8 });

    expect(res.status).toBe(200);
    expect(db.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { name: 'New Name', phone: '+94 77 123 4567', latitude: 6.9, longitude: 79.8 },
    });
    expect(res.body.data.name).toBe('New Name');
  });

  it('PUT /api/users/me cannot change role, email or password', async () => {
    const user = makeUser();
    givenUsers(user);

    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${tokenFor(user)}`)
      .send({ name: 'Ok', role: 'ADMIN', email: 'new@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.error.details[0]).toMatch(/role, email/);
    expect(db.update).not.toHaveBeenCalled();
  });

  it('PUT /api/users/me validates values', async () => {
    const user = makeUser();
    givenUsers(user);

    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${tokenFor(user)}`)
      .send({ name: '', latitude: 200 });

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        'Name is required',
        'Latitude and longitude must be provided together',
      ])
    );
  });

  it('GET /api/users/:id returns a public profile without private fields', async () => {
    const me = makeUser();
    const other = makeUser({ id: 'user-2', email: 'p@example.com', role: 'SERVICE_PROVIDER', phone: '+9471' });
    givenUsers(me, other);

    const res = await request(app).get('/api/users/user-2').set('Authorization', `Bearer ${tokenFor(me)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      id: 'user-2',
      name: 'Test Owner',
      role: 'SERVICE_PROVIDER',
      profileImage: null,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('TC-API-07: GET /api/users/:id for an unknown user returns 404', async () => {
    const me = makeUser();
    givenUsers(me);
    const res = await request(app).get('/api/users/missing').set('Authorization', `Bearer ${tokenFor(me)}`);
    expect(res.status).toBe(404);
    expectErrorEnvelope(res.body, 'NOT_FOUND');
  });
});

// =====================================================================
// Admin user management – US-37
// =====================================================================
describe('Admin user management (US-37)', () => {
  const admin = makeUser({ id: 'admin-1', email: 'admin@example.com', role: 'ADMIN' });
  const target = makeUser({ id: 'user-2', email: 'target@example.com' });

  it('non-admins get 403', async () => {
    const owner = makeUser();
    givenUsers(owner);
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${tokenFor(owner)}`);
    expect(res.status).toBe(403);
    expectErrorEnvelope(res.body, 'FORBIDDEN');
  });

  it('admin can list users with filters and pagination', async () => {
    givenUsers(admin, target);
    db.count.mockResolvedValue(1);
    db.findMany.mockResolvedValue([target]);

    const res = await request(app)
      .get('/api/admin/users?role=ITEM_OWNER&search=target&page=2&limit=5')
      .set('Authorization', `Bearer ${tokenFor(admin)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ page: 2, limit: 5, total: 1, totalPages: 1 });
    expect(res.body.data.items[0].passwordHash).toBeUndefined();
    expect(db.findMany.mock.calls[0][0]).toMatchObject({ skip: 5, take: 5 });
    expect(db.findMany.mock.calls[0][0].where.role).toBe('ITEM_OWNER');
  });

  it('rejects an unknown role filter', async () => {
    givenUsers(admin);
    const res = await request(app)
      .get('/api/admin/users?role=NOPE')
      .set('Authorization', `Bearer ${tokenFor(admin)}`);
    expect(res.status).toBe(400);
  });

  it('admin can change another user\'s role', async () => {
    givenUsers(admin, target);
    db.update.mockImplementation(({ data }) => Promise.resolve({ ...target, ...data }));

    const res = await request(app)
      .patch('/api/admin/users/user-2/role')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({ role: 'RECYCLER' });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('RECYCLER');
  });

  it('admin can deactivate another user', async () => {
    givenUsers(admin, target);
    db.update.mockImplementation(({ data }) => Promise.resolve({ ...target, ...data }));

    const res = await request(app)
      .patch('/api/admin/users/user-2/status')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);
  });

  it('admin cannot demote or deactivate themselves', async () => {
    givenUsers(admin);
    const auth = { Authorization: `Bearer ${tokenFor(admin)}` };

    const roleRes = await request(app).patch('/api/admin/users/admin-1/role').set(auth).send({ role: 'BUYER' });
    const statusRes = await request(app).patch('/api/admin/users/admin-1/status').set(auth).send({ isActive: false });

    expect(roleRes.status).toBe(400);
    expect(statusRes.status).toBe(400);
    expect(db.update).not.toHaveBeenCalled();
  });

  it('validates role and status payloads', async () => {
    givenUsers(admin, target);
    const auth = { Authorization: `Bearer ${tokenFor(admin)}` };

    const roleRes = await request(app).patch('/api/admin/users/user-2/role').set(auth).send({ role: 'KING' });
    const statusRes = await request(app).patch('/api/admin/users/user-2/status').set(auth).send({ isActive: 'no' });

    expect(roleRes.status).toBe(400);
    expect(statusRes.status).toBe(400);
  });

  it('returns 404 when the target user does not exist', async () => {
    givenUsers(admin);
    db.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: 'test',
      })
    );

    const res = await request(app)
      .patch('/api/admin/users/ghost/status')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({ isActive: false });

    expect(res.status).toBe(404);
  });
});

// =====================================================================
// Error handling – TC-API-10
// =====================================================================
describe('Error handling', () => {
  it('TC-API-10: unexpected errors return a generic 500 without internal details', async () => {
    db.findUnique.mockRejectedValue(new Error('connection string postgres://secret@db leaked'));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@example.com', password: 'Password123' });

    expect(res.status).toBe(500);
    expectErrorEnvelope(res.body, 'SERVER_ERROR');
    expect(JSON.stringify(res.body)).not.toContain('secret');
  });

  it('unknown routes return 404 in the standard format', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expectErrorEnvelope(res.body, 'NOT_FOUND');
  });
});
