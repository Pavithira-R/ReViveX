/**
 * Brute-force protection: repeated wrong passwords lock login for 15 minutes.
 * Prisma is mocked, so no database is needed to run these tests.
 */
import request from 'supertest';
import app from '../app';
import prisma from '../utils/prisma';
import {
  hashPassword,
  LOCK_DURATION_MS,
  MAX_FAILED_ATTEMPTS,
  resetLoginAttempts,
} from '../utils';

jest.mock('../utils/prisma', () => ({
  __esModule: true,
  default: { user: { findUnique: jest.fn() } },
}));

const db = prisma.user as unknown as { findUnique: jest.Mock };

const PASSWORD = 'Password123';
let owner: Record<string, unknown>;

const login = (email: string, password: string) =>
  request(app).post('/api/auth/login').send({ email, password });

const failTimes = async (times: number, email = 'owner@example.com') => {
  for (let i = 0; i < times; i++) {
    await login(email, 'WrongPass1');
  }
};

beforeAll(async () => {
  owner = {
    id: 'user-1',
    name: 'Test Owner',
    email: 'owner@example.com',
    passwordHash: await hashPassword(PASSWORD),
    role: 'ITEM_OWNER',
    phone: null,
    profileImage: null,
    latitude: null,
    longitude: null,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };
});

beforeEach(() => {
  jest.resetAllMocks();
  jest.useRealTimers();
  resetLoginAttempts();
  process.env.JWT_SECRET = 'test-secret-key-12345';
  db.findUnique.mockImplementation(({ where }: { where: { email: string } }) =>
    Promise.resolve(where.email === owner.email ? owner : null)
  );
});

it('allows a correct password after fewer than the maximum failures', async () => {
  await failTimes(MAX_FAILED_ATTEMPTS - 1);

  const res = await login('owner@example.com', PASSWORD);

  expect(res.status).toBe(200);
});

it('locks login after the maximum failures, even with the correct password', async () => {
  await failTimes(MAX_FAILED_ATTEMPTS);

  const res = await login('owner@example.com', PASSWORD);

  expect(res.status).toBe(429);
  expect(res.body.error.code).toBe('TOO_MANY_ATTEMPTS');
  expect(res.body.message).toBe('Too many failed login attempts. Try again in 15 minutes.');
  expect(res.headers['retry-after']).toBe(String(LOCK_DURATION_MS / 1000));
});

it('a successful login resets the failure count', async () => {
  await failTimes(MAX_FAILED_ATTEMPTS - 1);
  await login('owner@example.com', PASSWORD);
  await failTimes(MAX_FAILED_ATTEMPTS - 1);

  const res = await login('owner@example.com', PASSWORD);

  expect(res.status).toBe(200);
});

it('locking one email does not lock another account', async () => {
  await failTimes(MAX_FAILED_ATTEMPTS, 'someone@example.com');

  const res = await login('owner@example.com', PASSWORD);

  expect(res.status).toBe(200);
});

it('counts the email case-insensitively', async () => {
  await failTimes(MAX_FAILED_ATTEMPTS, 'OWNER@example.com');

  const res = await login('owner@example.com', PASSWORD);

  expect(res.status).toBe(429);
});

it('login works again after the lock expires', async () => {
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
  await failTimes(MAX_FAILED_ATTEMPTS);
  expect((await login('owner@example.com', PASSWORD)).status).toBe(429);

  jest.setSystemTime(Date.now() + LOCK_DURATION_MS + 1000);
  const res = await login('owner@example.com', PASSWORD);

  expect(res.status).toBe(200);
});

it('validation errors do not count as failed attempts', async () => {
  for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) {
    await request(app).post('/api/auth/login').send({ email: 'owner@example.com' });
  }

  const res = await login('owner@example.com', PASSWORD);

  expect(res.status).toBe(200);
});
