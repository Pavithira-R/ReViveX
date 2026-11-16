// Member 6 – Shared UI: a white rounded card with a soft shadow.
import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SHADOW, SPACING } from '../constants';

export const Card: React.FC<{
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}> = ({ children, style, onPress }) => {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    ...SHADOW.card,
  },
  pressed: {
    opacity: 0.85,
  },
});
