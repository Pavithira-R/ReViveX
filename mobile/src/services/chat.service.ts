// Member 6 – Chat
import { apiRequest } from './api';
import { ChatMessage, Conversation, ConversationMessages } from '../types';

export const chatService = {
  list: () => apiRequest<Conversation[]>('GET', '/conversations'),

  startWithEmail: (email: string) => apiRequest<Conversation>('POST', '/conversations', { email }),

  /** For other modules: open a chat straight from an item, provider or request. */
  startWithUser: (userId: string) => apiRequest<Conversation>('POST', '/conversations', { userId }),

  messages: (conversationId: string) =>
    apiRequest<ConversationMessages>('GET', `/conversations/${conversationId}/messages`),

  send: (conversationId: string, body: string) =>
    apiRequest<ChatMessage>('POST', `/conversations/${conversationId}/messages`, { body }),
};
