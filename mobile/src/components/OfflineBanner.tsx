// Member 6 – Offline mode
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface OfflineBannerProps {
  /** When the saved copy was made; nothing is shown when null (online). */
  savedAt: string | null;
}

const formatSavedAt = (iso: string) => {
  const date = new Date(iso);
  const sameDay = date.toDateString() === new Date().toDateString();
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return sameDay ? time : `${date.toLocaleDateString()} ${time}`;
};

/** Shown above a screen's content when it is displaying data saved on the phone. */
export const OfflineBanner: React.FC<OfflineBannerProps> = ({ savedAt }) => {
  if (!savedAt) return null;
  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Text style={styles.title}>You're offline</Text>
      <Text style={styles.text}>
        Showing data saved at {formatSavedAt(savedAt)}. Pull down to refresh when you're back online.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FFF4E5',
    borderColor: '#F5C97A',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  title: { fontSize: 14, fontWeight: '700', color: '#8A5300' },
  text: { fontSize: 13, color: '#8A5300', marginTop: 2, lineHeight: 18 },
});
