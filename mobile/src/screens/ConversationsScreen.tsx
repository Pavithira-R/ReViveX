// Member 6 – Chat
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormInput, MessageBanner, PrimaryButton } from '../components';
import { COLORS, ROLE_LABELS } from '../constants';
import { chatService } from '../services';
import { Conversation } from '../types';
import { getErrorMessage, isValidEmail } from '../utils';

interface ConversationsScreenProps {
  onBack: () => void;
  onOpenConversation: (conversation: Conversation) => void;
}

/** The user's chats, most recent first, plus a form to start a new one by email. */
export const ConversationsScreen: React.FC<ConversationsScreenProps> = ({
  onBack,
  onOpenConversation,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const load = useCallback(async (refreshing = false) => {
    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);
    try {
      setConversations(await chatService.list());
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Could not load your chats.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startChat = async () => {
    setErrorMessage(null);
    if (!isValidEmail(email)) {
      setErrorMessage('Enter the email address of the person you want to chat with.');
      return;
    }
    setIsStarting(true);
    try {
      const conversation = await chatService.startWithEmail(email.trim());
      setEmail('');
      onOpenConversation(conversation);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Could not start the chat.'));
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} accessibilityRole="button" hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.topTitle}>Messages</Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} />}
      >
        <MessageBanner message={errorMessage} />

        <View style={styles.card}>
          <FormInput
            label="Start a new chat"
            placeholder="Their email address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={startChat}
          />
          <PrimaryButton title="Start chat" onPress={startChat} loading={isStarting} />
        </View>

        {isLoading ? <ActivityIndicator color={COLORS.primary} style={styles.loader} /> : null}

        {!isLoading && errorMessage && conversations.length === 0 ? (
          <PrimaryButton title="Try again" variant="outlined" onPress={() => load()} />
        ) : null}

        {!isLoading && !errorMessage && conversations.length === 0 ? (
          <Text style={styles.empty}>No chats yet. Start one with a technician, buyer or recycler.</Text>
        ) : null}

        {conversations.map((conversation) => (
          <Pressable
            key={conversation.id}
            onPress={() => onOpenConversation(conversation)}
            accessibilityRole="button"
            style={styles.row}
          >
            <View style={styles.rowText}>
              <Text style={styles.name}>{conversation.otherUser.name}</Text>
              <Text style={styles.role}>{ROLE_LABELS[conversation.otherUser.role]}</Text>
              <Text style={styles.preview} numberOfLines={1}>
                {conversation.lastMessage ? conversation.lastMessage.body : 'No messages yet'}
              </Text>
            </View>
            {conversation.unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{conversation.unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
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
  topTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  topSpacer: { minWidth: 60 },
  content: { padding: 20 },
  loader: { marginTop: 24 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
  },
  empty: { fontSize: 15, color: COLORS.textMuted, textAlign: 'center', marginTop: 24, lineHeight: 22 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 10,
  },
  rowText: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  role: { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  preview: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 12,
  },
  badgeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
