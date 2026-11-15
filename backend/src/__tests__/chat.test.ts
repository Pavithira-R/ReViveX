/**
 * Member 6 – Chat: starting conversations, reading and sending messages.
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
    conversation: { findMany: jest.fn(), findUnique: jest.fn(), upsert: jest.fn(), update: jest.fn() },
    message: { findMany: jest.fn(), updateMany: jest.fn(), create: jest.fn() },
    notification: { create: jest.fn() },
  },
}));

const db = prisma as unknown as {
  user: { findUnique: jest.Mock };
  conversation: Record<'findMany' | 'findUnique' | 'upsert' | 'update', jest.Mock>;
  message: Record<'findMany' | 'updateMany' | 'create', jest.Mock>;
  notification: { create: jest.Mock };
};

// 'a-owner' < 'b-tech', so the owner is always userA of their conversation.
const owner = { id: 'a-owner', name: 'Nimal Perera', email: 'nimal@example.com', role: 'ITEM_OWNER', isActive: true };
const tech = { id: 'b-tech', name: 'Kasun Repairs', email: 'kasun@example.com', role: 'SERVICE_PROVIDER', isActive: true };
const users = [owner, tech];

const tokenFor = (u: typeof owner) =>
  `Bearer ${generateToken({ id: u.id, role: u.role as 'ITEM_OWNER', email: u.email, name: u.name })}`;

const message = (overrides: Record<string, unknown> = {}) => ({
  id: 'm1',
  conversationId: 'c1',
  senderId: tech.id,
  body: 'Your laptop is ready.',
  readAt: null,
  createdAt: new Date('2026-11-14T10:00:00Z'),
  ...overrides,
});

const conversation = (overrides: Record<string, unknown> = {}) => ({
  id: 'c1',
  userAId: owner.id,
  userBId: tech.id,
  userA: { id: owner.id, name: owner.name, role: owner.role },
  userB: { id: tech.id, name: tech.name, role: tech.role },
  messages: [message()],
  _count: { messages: 1 },
  createdAt: new Date('2026-11-14T09:00:00Z'),
  updatedAt: new Date('2026-11-14T10:00:00Z'),
  ...overrides,
});

beforeEach(() => {
  jest.resetAllMocks();
  process.env.JWT_SECRET = 'test-secret-key-12345';
  db.user.findUnique.mockImplementation(({ where }: { where: { id?: string; email?: string } }) =>
    Promise.resolve(users.find((u) => (where.id ? u.id === where.id : u.email === where.email)) ?? null)
  );
});

describe('POST /api/conversations', () => {
  it('opens a conversation with a user found by email', async () => {
    db.conversation.upsert.mockResolvedValue(conversation({ messages: [], _count: { messages: 0 } }));

    const res = await request(app)
      .post('/api/conversations')
      .set('Authorization', tokenFor(owner))
      .send({ email: 'KASUN@example.com' });

    expect(res.status).toBe(200);
    expect(db.conversation.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userAId_userBId: { userAId: owner.id, userBId: tech.id } },
        create: { userAId: owner.id, userBId: tech.id },
      })
    );
    expect(res.body.data.otherUser).toEqual({ id: tech.id, name: tech.name, role: tech.role });
  });

  it('stores the pair in the same order whoever starts the chat', async () => {
    db.conversation.upsert.mockResolvedValue(conversation());

    await request(app)
      .post('/api/conversations')
      .set('Authorization', tokenFor(tech))
      .send({ userId: owner.id });

    expect(db.conversation.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userAId_userBId: { userAId: owner.id, userBId: tech.id } } })
    );
  });

  it('rejects a chat with yourself', async () => {
    const res = await request(app)
      .post('/api/conversations')
      .set('Authorization', tokenFor(owner))
      .send({ userId: owner.id });

    expect(res.status).toBe(400);
    expect(db.conversation.upsert).not.toHaveBeenCalled();
  });

  it('returns 404 for an unknown email', async () => {
    const res = await request(app)
      .post('/api/conversations')
      .set('Authorization', tokenFor(owner))
      .send({ email: 'nobody@example.com' });

    expect(res.status).toBe(404);
  });

  it('requires a userId or email', async () => {
    const res = await request(app).post('/api/conversations').set('Authorization', tokenFor(owner)).send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/conversations', () => {
  it('requires login', async () => {
    expect((await request(app).get('/api/conversations')).status).toBe(401);
  });

  it('lists conversations with the other person, last message and unread count', async () => {
    db.conversation.findMany.mockResolvedValue([conversation()]);

    const res = await request(app).get('/api/conversations').set('Authorization', tokenFor(owner));

    expect(res.status).toBe(200);
    expect(db.conversation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { OR: [{ userAId: owner.id }, { userBId: owner.id }] } })
    );
    expect(res.body.data[0]).toMatchObject({
      id: 'c1',
      otherUser: { name: tech.name },
      lastMessage: { body: 'Your laptop is ready.' },
      unreadCount: 1,
    });
  });
});

describe('GET /api/conversations/:id/messages', () => {
  it('returns the messages and marks the other person’s as read', async () => {
    db.conversation.findUnique.mockResolvedValue(conversation());
    db.message.findMany.mockResolvedValue([
      message({ id: 'm2', senderId: owner.id, body: 'Thanks!', createdAt: new Date('2026-11-14T10:05:00Z') }),
      message(),
    ]);

    const res = await request(app).get('/api/conversations/c1/messages').set('Authorization', tokenFor(owner));

    expect(res.status).toBe(200);
    expect(db.message.updateMany).toHaveBeenCalledWith({
      where: { conversationId: 'c1', senderId: { not: owner.id }, readAt: null },
      data: { readAt: expect.any(Date) },
    });
    // Oldest first, with isMine from the reader's point of view.
    expect(res.body.data.messages.map((m: { body: string; isMine: boolean }) => [m.body, m.isMine])).toEqual([
      ['Your laptop is ready.', false],
      ['Thanks!', true],
    ]);
  });

  it("returns 404 for a conversation the user isn't part of", async () => {
    db.conversation.findUnique.mockResolvedValue(
      conversation({ userAId: 'x-someone', userBId: 'y-other' })
    );

    const res = await request(app).get('/api/conversations/c1/messages').set('Authorization', tokenFor(owner));

    expect(res.status).toBe(404);
    expect(db.message.findMany).not.toHaveBeenCalled();
  });
});

describe('POST /api/conversations/:id/messages', () => {
  it('sends a message and notifies the other person', async () => {
    db.conversation.findUnique.mockResolvedValue(conversation());
    db.message.create.mockResolvedValue(message({ id: 'm3', senderId: owner.id, body: 'When can I collect it?' }));

    const res = await request(app)
      .post('/api/conversations/c1/messages')
      .set('Authorization', tokenFor(owner))
      .send({ body: '  When can I collect it?  ' });

    expect(res.status).toBe(201);
    expect(db.message.create).toHaveBeenCalledWith({
      data: { conversationId: 'c1', senderId: owner.id, body: 'When can I collect it?' },
    });
    expect(res.body.data).toMatchObject({ body: 'When can I collect it?', isMine: true });
    expect(db.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: tech.id,
        type: 'MESSAGE',
        title: 'New message from Nimal Perera',
        message: 'When can I collect it?',
        refId: 'c1',
      }),
    });
  });

  it.each([
    ['empty', '   '],
    ['too long', 'x'.repeat(1001)],
  ])('rejects an %s message', async (_label, body) => {
    const res = await request(app)
      .post('/api/conversations/c1/messages')
      .set('Authorization', tokenFor(owner))
      .send({ body });

    expect(res.status).toBe(400);
    expect(db.message.create).not.toHaveBeenCalled();
  });

  it("cannot send into a conversation the user isn't part of", async () => {
    db.conversation.findUnique.mockResolvedValue(
      conversation({ userAId: 'x-someone', userBId: 'y-other' })
    );

    const res = await request(app)
      .post('/api/conversations/c1/messages')
      .set('Authorization', tokenFor(owner))
      .send({ body: 'Hello' });

    expect(res.status).toBe(404);
    expect(db.message.create).not.toHaveBeenCalled();
  });
});
