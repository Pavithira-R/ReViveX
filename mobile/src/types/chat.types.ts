// Member 6 – Chat
import { UserRole } from './auth.types';

export interface ChatUser {
  id: string;
  name: string;
  role: UserRole;
}

export interface Conversation {
  id: string;
  otherUser: ChatUser;
  lastMessage: { body: string; senderId: string; createdAt: string } | null;
  unreadCount: number;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  body: string;
  isMine: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface ConversationMessages {
  conversation: Conversation;
  messages: ChatMessage[];
}
