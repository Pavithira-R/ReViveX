// Member 6 – Chat
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageBanner } from '../components';
import { COLORS } from '../constants';
import { chatService } from '../services';
import { ChatMessage, Conversation } from '../types';
import { getErrorMessage } from '../utils';

interface ChatScreenProps {
  conversation: Conversation;
  onBack: () => void;
}

/** New messages are fetched this often while the chat is open. */
export const CHAT_REFRESH_MS = 5000;
const MAX_LENGTH = 1000;

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/** One conversation: message bubbles, a send box, and automatic refresh while open. */
export const ChatScreen: React.FC<ChatScreenProps> = ({ conversation, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  const load = useCallback(async () => {
    try {
      const result = await chatService.messages(conversation.id);
      setMessages(result.messages);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Could not load messages.'));
    } finally {
      setIsLoading(false);
    }
  }, [conversation.id]);

  useEffect(() => {
    load();
    const timer = setInterval(load, CHAT_REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const send = async () => {
    const text = draft.trim();
    if (!text || isSending) return;
    setIsSending(true);
    try {
      const sent = await chatService.send(conversation.id, text);
      setMessages((current) => [...current, sent]);
      setDraft('');
      setErrorMessage(null);
    } catch (error) {
      // The draft is kept so nothing the user typed is lost.
      setErrorMessage(getErrorMessage(error, 'Message not sent. Please try again.'));
    } finally {
      setIsSending(false);
    }
  };

  const canSend = draft.trim().length > 0 && !isSending;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} accessibilityRole="button" hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          {conversation.otherUser.name}
        </Text>
        <View style={styles.topSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          <MessageBanner message={errorMessage} />
          {isLoading ? <ActivityIndicator color={COLORS.primary} style={styles.loader} /> : null}
          {!isLoading && messages.length === 0 && !errorMessage ? (
            <Text style={styles.empty}>Say hello to {conversation.otherUser.name}.</Text>
          ) : null}

          {messages.map((message) => (
            <View
              key={message.id}
              style={[styles.bubble, message.isMine ? styles.mine : styles.theirs]}
            >
              <Text style={[styles.body, message.isMine && styles.mineText]}>{message.body}</Text>
              <Text style={[styles.time, message.isMine && styles.mineTime]}>
                {formatTime(message.createdAt)}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message"
            placeholderTextColor={COLORS.textMuted}
            value={draft}
            onChangeText={setDraft}
            maxLength={MAX_LENGTH}
            multiline
            accessibilityLabel="Message"
          />
          <Pressable
            onPress={send}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSend, busy: isSending }}
            style={[styles.sendButton, !canSend && styles.sendDisabled]}
          >
            {isSending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.sendText}>Send</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  back: { fontSize: 16, color: COLORS.primary, fontWeight: '600', minWidth: 60 },
  topTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, flexShrink: 1 },
  topSpacer: { minWidth: 60 },
  messages: { padding: 16, flexGrow: 1 },
  loader: { marginTop: 24 },
  empty: { fontSize: 15, color: COLORS.textMuted, textAlign: 'center', marginTop: 24 },
  bubble: { maxWidth: '80%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8 },
  mine: { alignSelf: 'flex-end', backgroundColor: COLORS.primary },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  body: { fontSize: 15, color: COLORS.text, lineHeight: 21 },
  mineText: { color: '#FFFFFF' },
  time: { fontSize: 11, color: COLORS.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  mineTime: { color: COLORS.primaryLight },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
  },
  sendButton: {
    marginLeft: 8,
    height: 44,
    minWidth: 64,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  sendDisabled: { opacity: 0.5 },
  sendText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
