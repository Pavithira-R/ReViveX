import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../constants';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'filled' | 'outlined' | 'danger';
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'filled',
}) => {
  const isDisabled = disabled || loading;
  const isFilled = variant === 'filled';

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        isFilled && styles.filled,
        variant === 'outlined' && styles.outlined,
        variant === 'danger' && styles.danger,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isFilled ? '#FFFFFF' : COLORS.primary} />
      ) : (
        <Text
          style={[
            styles.text,
            isFilled && styles.textFilled,
            variant === 'outlined' && styles.textOutlined,
            variant === 'danger' && styles.textDanger,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginTop: 10,
  },
  filled: { backgroundColor: COLORS.primary, ...SHADOW.card },
  outlined: { borderWidth: 1.5, borderColor: COLORS.primary, backgroundColor: COLORS.surface },
  danger: { borderWidth: 1.5, borderColor: COLORS.error, backgroundColor: COLORS.surface },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.55 },
  text: { fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  textFilled: { color: '#FFFFFF' },
  textOutlined: { color: COLORS.primary },
  textDanger: { color: COLORS.error },
});
