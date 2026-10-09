import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants';

interface MessageBannerProps {
  message: string | null;
  type?: 'error' | 'success';
}

/** Inline error/success message shown above a form. Renders nothing when message is empty. */
export const MessageBanner: React.FC<MessageBannerProps> = ({ message, type = 'error' }) => {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <View
      style={[styles.banner, isError ? styles.error : styles.success]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={[styles.text, { color: isError ? COLORS.error : COLORS.success }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: { borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1 },
  error: { backgroundColor: COLORS.errorBg, borderColor: '#F5C2C0' },
  success: { backgroundColor: COLORS.primaryLight, borderColor: '#B9DFBB' },
  text: { fontSize: 14, lineHeight: 20 },
});
