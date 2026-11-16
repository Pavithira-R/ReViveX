// Member 6 – Chat (Firestore `conversations` + `messages` subcollection)
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { ApiError } from './api';
import { auth, db } from './firebase';
import { fsCall, nowIso } from './firebaseHelpers';
import { notify } from './notification.service';
import { ChatMessage, ChatUser, Conversation, ConversationMessages, UserRole } from '../types';

const MESSAGE_MAX_LENGTH = 1000;
const MESSAGE_LIMIT = 100;
const PREVIEW_LENGTH = 80;

interface StoredConversation {
  participants: string[];
  participantInfo: Record<string, { name: string; role: UserRole }>;
  lastMessage: Conversation['lastMessage'];
  unread: Record<string, number>;
  updatedAt: string;
}

interface StoredMessage {
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

const conversations = collection(db, 'conversations');
const messagesOf = (conversationId: string) => collection(db, 'conversations', conversationId, 'messages');

const currentUid = (): string => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new ApiError('Authentication required', 401, 'UNAUTHORIZED');
  return uid;
};

const validation = (detail: string) => new ApiError('Validation failed', 400, 'VALIDATION_ERROR', [detail]);
const notFound = () => new ApiError('Conversation not found', 404, 'NOT_FOUND');

/** One conversation per pair of users: the id is both user ids, sorted. */
const conversationId = (a: string, b: string) => [a, b].sort().join('_');

const toView = (id: string, data: StoredConversation, uid: string): Conversation => {
  const otherId = data.participants.find((p) => p !== uid) ?? uid;
  const other = data.participantInfo[otherId] ?? { name: 'Unknown user', role: 'ITEM_OWNER' as UserRole };
  return {
    id,
    otherUser: { id: otherId, name: other.name, role: other.role },
    lastMessage: data.lastMessage ?? null,
    unreadCount: data.unread?.[uid] ?? 0,
    updatedAt: data.updatedAt,
  };
};

const toMessage = (id: string, data: StoredMessage, uid: string): ChatMessage => ({
  id,
  senderId: data.senderId,
  body: data.body,
  isMine: data.senderId === uid,
  readAt: data.readAt,
  createdAt: data.createdAt,
});

const profileOf = async (uid: string): Promise<ChatUser> => {
  const snapshot = await getDoc(doc(db, 'users', uid));
  if (!snapshot.exists()) throw new ApiError('User not found', 404, 'NOT_FOUND');
  const data = snapshot.data();
  return { id: uid, name: String(data.name ?? ''), role: data.role as UserRole };
};

/** Someone else's conversation is reported as not found. */
const loadForParticipant = async (id: string, uid: string): Promise<StoredConversation> => {
  let snapshot;
  try {
    snapshot = await getDoc(doc(db, 'conversations', id));
  } catch (error) {
    if ((error as { code?: string }).code === 'permission-denied') throw notFound();
    throw error;
  }
  const data = snapshot.data() as StoredConversation | undefined;
  if (!data || !data.participants.includes(uid)) throw notFound();
  return data;
};

/** Opens the existing chat with this user, or creates it. */
const startWith = async (otherId: string): Promise<Conversation> => {
  const uid = currentUid();
  if (otherId === uid) throw validation('You cannot start a chat with yourself');
  const id = conversationId(uid, otherId);
  const ref = doc(db, 'conversations', id);
  const existing = await getDoc(ref);
  if (existing.exists()) return toView(id, existing.data() as StoredConversation, uid);

  const [me, other] = await Promise.all([profileOf(uid), profileOf(otherId)]);
  const data: StoredConversation = {
    participants: [uid, otherId].sort(),
    participantInfo: {
      [me.id]: { name: me.name, role: me.role },
      [other.id]: { name: other.name, role: other.role },
    },
    lastMessage: null,
    unread: { [uid]: 0, [otherId]: 0 },
    updatedAt: nowIso(),
  };
  await setDoc(ref, data);
  return toView(id, data, uid);
};

export const chatService = {
  /** The signed-in user's chats, most recent first. */
  list: (): Promise<Conversation[]> =>
    fsCall(async () => {
      const uid = currentUid();
      const snapshot = await getDocs(query(conversations, where('participants', 'array-contains', uid)));
      return snapshot.docs
        .map((d) => toView(d.id, d.data() as StoredConversation, uid))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }),

  startWithEmail: (email: string): Promise<Conversation> =>
    fsCall(async () => {
      const normalized = email.trim().toLowerCase();
      if (!normalized) throw validation('Provide the userId or email of the person to chat with');
      const found = await getDocs(query(collection(db, 'users'), where('email', '==', normalized)));
      if (found.empty) throw new ApiError('User not found', 404, 'NOT_FOUND');
      return startWith(found.docs[0].id);
    }),

  /** For other modules: open a chat straight from an item, provider or request. */
  startWithUser: (userId: string): Promise<Conversation> => fsCall(() => startWith(userId)),

  /** Messages of a conversation (oldest first). Marks the other person's messages as read. */
  messages: (id: string): Promise<ConversationMessages> =>
    fsCall(async () => {
      const uid = currentUid();
      const conversation = await loadForParticipant(id, uid);
      const all = (await getDocs(messagesOf(id))).docs
        .map((d) => ({ id: d.id, ...(d.data() as StoredMessage) }))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

      const unread = all.filter((m) => m.senderId !== uid && !m.readAt);
      const readAt = nowIso();
      if (unread.length || conversation.unread?.[uid]) {
        const batch = writeBatch(db);
        unread.forEach((m) => batch.update(doc(db, 'conversations', id, 'messages', m.id), { readAt }));
        batch.update(doc(db, 'conversations', id), { [`unread.${uid}`]: 0 });
        await batch.commit();
        unread.forEach((m) => (m.readAt = readAt));
      }

      return {
        conversation: { ...toView(id, conversation, uid), unreadCount: 0 },
        messages: all.slice(-MESSAGE_LIMIT).map((m) => toMessage(m.id, m, uid)),
      };
    }),

  send: (id: string, body: string): Promise<ChatMessage> =>
    fsCall(async () => {
      const uid = currentUid();
      const text = typeof body === 'string' ? body.trim() : '';
      if (!text) throw validation('Message cannot be empty');
      if (text.length > MESSAGE_MAX_LENGTH) {
        throw validation(`Message must be at most ${MESSAGE_MAX_LENGTH} characters`);
      }
      const conversation = await loadForParticipant(id, uid);
      const otherId = conversation.participants.find((p) => p !== uid) ?? uid;

      const message: StoredMessage = { senderId: uid, body: text, readAt: null, createdAt: nowIso() };
      const created = await addDoc(messagesOf(id), message);
      // Moves the chat to the top of both users' lists.
      await updateDoc(doc(db, 'conversations', id), {
        lastMessage: { body: text, senderId: uid, createdAt: message.createdAt },
        updatedAt: message.createdAt,
        [`unread.${otherId}`]: increment(1),
      });

      const senderName = conversation.participantInfo[uid]?.name ?? 'someone';
      const preview = text.length > PREVIEW_LENGTH ? `${text.slice(0, PREVIEW_LENGTH)}…` : text;
      await notify(otherId, `New message from ${senderName}`, preview, { type: 'MESSAGE', refId: id });

      return toMessage(created.id, message, uid);
    }),
};
