import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { COLORS, RADIUS } from '../constants';

export const Card: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
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
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: 16,
  },
  pressed: {
    opacity: 0.85,
  },
});

