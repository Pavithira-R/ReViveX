// Member 6 – Chat
import { UserRole } from './auth.types';

export const MESSAGE_MAX_LENGTH = 1000;

export interface ChatUser {
  id: string;
  name: string;
  role: UserRole;
}

export interface ConversationView {
  id: string;
  otherUser: ChatUser;
  lastMessage: { body: string; senderId: string; createdAt: Date | string } | null;
  /** Messages from the other person not read yet. */
  unreadCount: number;
  updatedAt: Date | string;
}

export interface MessageView {
  id: string;
  senderId: string;
  body: string;
  isMine: boolean;
  readAt: Date | string | null;
  createdAt: Date | string;
}

/** Response of GET /api/conversations/:id/messages. */
export interface ConversationMessages {
  conversation: ConversationView;
  messages: MessageView[];
}

/** Body of POST /api/conversations: who to chat with. */
export interface StartConversationDTO {
  userId?: string;
  email?: string;
}
