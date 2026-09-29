import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'neutral';
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  style,
  textStyle,
  size = 'md',
}) => {
  const getBadgeStyle = (): ViewStyle => {
    switch (variant) {
      case 'success':
        return { backgroundColor: Colors.successLight };
      case 'warning':
        return { backgroundColor: Colors.accentLight };
      case 'danger':
        return { backgroundColor: Colors.dangerLight };
      case 'info':
        return { backgroundColor: Colors.secondaryLight };
      case 'neutral':
        return { backgroundColor: Colors.surfaceSubtle };
      case 'primary':
      default:
        return { backgroundColor: Colors.primaryLight };
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'success':
        return Colors.success;
      case 'warning':
        return Colors.accent;
      case 'danger':
        return Colors.danger;
      case 'info':
        return Colors.secondary;
      case 'neutral':
        return Colors.textSecondary;
      case 'primary':
      default:
        return Colors.primaryDark;
    }
  };

  return (
    <View
      style={[
        styles.base,
        getBadgeStyle(),
        size === 'sm' ? styles.small : styles.medium,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: getTextColor() },
          size === 'sm' && styles.smallText,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medium: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm + 4,
  },
  small: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.xs + 2,
  },
  text: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.semibold,
  },
  smallText: {
    fontSize: 10,
  },
});
