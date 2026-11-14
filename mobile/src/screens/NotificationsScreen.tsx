// Member 6 – In-app notifications
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
import { MessageBanner, PrimaryButton } from '../components';
import { COLORS } from '../constants';
import { notificationService } from '../services';
import { AppNotification } from '../types';
import { getErrorMessage } from '../utils';

interface NotificationsScreenProps {
  onBack: () => void;
}

const formatWhen = (iso: string) => {
  const date = new Date(iso);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

/** List of the user's in-app notifications. Tapping one marks it as read. */
export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onBack }) => {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async (refreshing = false) => {
    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await notificationService.list();
      setItems(result.items);
      setUnreadCount(result.unreadCount);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Could not load notifications.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (notification: AppNotification) => {
    if (notification.isRead) return;
    try {
      await notificationService.markRead(notification.id);
      setItems((current) =>
        current.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setItems((current) => current.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} accessibilityRole="button" hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.topTitle}>Notifications</Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} />}
      >
        {isLoading ? <ActivityIndicator color={COLORS.primary} style={styles.loader} /> : null}

        <MessageBanner message={errorMessage} />
        {!isLoading && errorMessage && items.length === 0 ? (
          <PrimaryButton title="Try again" variant="outlined" onPress={() => load()} />
        ) : null}

        {!isLoading && !errorMessage && items.length === 0 ? (
          <Text style={styles.empty}>
            No notifications yet. Updates about your requests and eco points will appear here.
          </Text>
        ) : null}

        {unreadCount > 0 ? (
          <PrimaryButton title={`Mark all as read (${unreadCount})`} variant="outlined" onPress={markAllRead} />
        ) : null}

        {items.map((notification) => (
          <Pressable
            key={notification.id}
            onPress={() => markRead(notification)}
            accessibilityRole="button"
            accessibilityState={{ selected: !notification.isRead }}
            style={[styles.card, !notification.isRead && styles.unreadCard]}
          >
            <View style={styles.titleRow}>
              {!notification.isRead ? <View style={styles.dot} /> : null}
              <Text style={[styles.title, !notification.isRead && styles.unreadTitle]}>
                {notification.title}
              </Text>
            </View>
            <Text style={styles.message}>{notification.message}</Text>
            <Text style={styles.when}>{formatWhen(notification.createdAt)}</Text>
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
  loader: { marginTop: 40 },
  empty: { fontSize: 15, color: COLORS.textMuted, textAlign: 'center', marginTop: 40, lineHeight: 22 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginTop: 12,
  },
  unreadCard: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginRight: 8 },
  title: { fontSize: 16, fontWeight: '600', color: COLORS.text, flexShrink: 1 },
  unreadTitle: { fontWeight: '800' },
  message: { fontSize: 15, color: COLORS.text, marginTop: 4, lineHeight: 21 },
  when: { fontSize: 12, color: COLORS.textMuted, marginTop: 8 },
});
