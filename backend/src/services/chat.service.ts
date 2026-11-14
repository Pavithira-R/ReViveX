// Member 6 – Chat
import { Message, User } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError, normalizeEmail, validationError } from '../utils';
import {
  ChatUser,
  ConversationMessages,
  ConversationView,
  MESSAGE_MAX_LENGTH,
  MessageView,
  StartConversationDTO,
  UserRole,
} from '../types';
import { notify } from './notification.service';

const MESSAGE_LIMIT = 100;
const PREVIEW_LENGTH = 80;

const chatUserSelect = { id: true, name: true, role: true } as const;

/** The pair is stored in a fixed order so one conversation exists per two users. */
const orderedPair = (a: string, b: string) => (a < b ? [a, b] : [b, a]);

const conversationInclude = (userId: string) => ({
  userA: { select: chatUserSelect },
  userB: { select: chatUserSelect },
  messages: { orderBy: { createdAt: 'desc' as const }, take: 1 },
  _count: { select: { messages: { where: { senderId: { not: userId }, readAt: null } } } },
});

type ConversationRecord = {
  id: string;
  userAId: string;
  userA: Pick<User, 'id' | 'name' | 'role'>;
  userB: Pick<User, 'id' | 'name' | 'role'>;
  messages: Message[];
  _count: { messages: number };
  updatedAt: Date;
};

const toChatUser = (user: Pick<User, 'id' | 'name' | 'role'>): ChatUser => ({
  id: user.id,
  name: user.name,
  role: user.role as UserRole,
});

const toConversationView = (record: ConversationRecord, userId: string): ConversationView => {
  const last = record.messages[0];
  return {
    id: record.id,
    otherUser: toChatUser(record.userAId === userId ? record.userB : record.userA),
    lastMessage: last ? { body: last.body, senderId: last.senderId, createdAt: last.createdAt } : null,
    unreadCount: record._count.messages,
    updatedAt: record.updatedAt,
  };
};

const toMessageView = (message: Message, userId: string): MessageView => ({
  id: message.id,
  senderId: message.senderId,
  body: message.body,
  isMine: message.senderId === userId,
  readAt: message.readAt,
  createdAt: message.createdAt,
});

export class ChatService {
  /** The signed-in user's conversations, most recent first. */
  async listConversations(userId: string): Promise<ConversationView[]> {
    const records = await prisma.conversation.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      include: conversationInclude(userId),
      orderBy: { updatedAt: 'desc' },
    });
    return (records as ConversationRecord[]).map((r) => toConversationView(r, userId));
  }

  /** Open the conversation with another user (by id or email), creating it the first time. */
  async startConversation(userId: string, input: StartConversationDTO): Promise<ConversationView> {
    const { userId: otherId, email } = input ?? {};
    if (!otherId && !(typeof email === 'string' && email.trim())) {
      throw validationError(['Provide the userId or email of the person to chat with']);
    }

    const other = await prisma.user.findUnique({
      where: otherId ? { id: otherId } : { email: normalizeEmail(email as string) },
    });
    if (!other || !other.isActive) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }
    if (other.id === userId) {
      throw new AppError('You cannot start a chat with yourself', 400, 'VALIDATION_ERROR');
    }

    const [userAId, userBId] = orderedPair(userId, other.id);
    const record = await prisma.conversation.upsert({
      where: { userAId_userBId: { userAId, userBId } },
      create: { userAId, userBId },
      update: {},
      include: conversationInclude(userId),
    });
    return toConversationView(record as ConversationRecord, userId);
  }

  /** Messages of a conversation (oldest first). Marks the other person's messages as read. */
  async getMessages(userId: string, conversationId: string): Promise<ConversationMessages> {
    const conversation = await this.findForParticipant(userId, conversationId);

    await prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });

    const latest = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: MESSAGE_LIMIT,
    });

    return {
      conversation: { ...toConversationView(conversation, userId), unreadCount: 0 },
      messages: latest.reverse().map((m) => toMessageView(m, userId)),
    };
  }

  async sendMessage(userId: string, conversationId: string, body: unknown): Promise<MessageView> {
    const text = typeof body === 'string' ? body.trim() : '';
    if (!text) throw validationError(['Message cannot be empty']);
    if (text.length > MESSAGE_MAX_LENGTH) {
      throw validationError([`Message must be at most ${MESSAGE_MAX_LENGTH} characters`]);
    }

    const conversation = await this.findForParticipant(userId, conversationId);
    const message = await prisma.message.create({
      data: { conversationId, senderId: userId, body: text },
    });
    // Moves the chat to the top of both users' lists.
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const sender = conversation.userAId === userId ? conversation.userA : conversation.userB;
    const recipient = conversation.userAId === userId ? conversation.userB : conversation.userA;
    const preview = text.length > PREVIEW_LENGTH ? `${text.slice(0, PREVIEW_LENGTH)}…` : text;
    await notify(recipient.id, `New message from ${sender.name}`, preview, {
      type: 'MESSAGE',
      refId: conversationId,
    });

    return toMessageView(message, userId);
  }

  /** Someone else's conversation is reported as not found, so ids can't be probed. */
  private async findForParticipant(userId: string, conversationId: string) {
    const record = (await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: conversationInclude(userId),
    })) as (ConversationRecord & { userBId: string }) | null;

    if (!record || (record.userAId !== userId && record.userBId !== userId)) {
      throw new AppError('Conversation not found', 404, 'NOT_FOUND');
    }
    return record;
  }
}

export const chatService = new ChatService();
