import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'danger' | 'warning' | 'primary' | 'neutral';
  size?: 'sm' | 'md';
  style?: ViewStyle | ViewStyle[];
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  style,
}) => {
  const getContainerStyle = () => {
    switch (variant) {
      case 'success':
        return styles.successBg;
      case 'danger':
        return styles.dangerBg;
      case 'warning':
        return styles.warningBg;
      case 'primary':
        return styles.primaryBg;
      default:
        return styles.neutralBg;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'success':
        return styles.successText;
      case 'danger':
        return styles.dangerText;
      case 'warning':
        return styles.warningText;
      case 'primary':
        return styles.primaryText;
      default:
        return styles.neutralText;
    }
  };

  return (
    <View
      style={[
        styles.badge,
        size === 'sm' ? styles.smBadge : styles.mdBadge,
        getContainerStyle(),
        style,
      ]}
    >
      <Text style={[styles.text, size === 'sm' ? styles.smText : styles.mdText, getTextStyle()]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smBadge: {
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
  },
  mdBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  text: {
    fontWeight: Typography.fontWeights.semibold,
  },
  smText: {
    fontSize: 10,
  },
  mdText: {
    fontSize: 12,
  },
  successBg: {
    backgroundColor: Colors.successLight,
  },
  successText: {
    color: Colors.success,
  },
  dangerBg: {
    backgroundColor: Colors.dangerLight,
  },
  dangerText: {
    color: Colors.danger,
  },
  warningBg: {
    backgroundColor: Colors.warningLight,
  },
  warningText: {
    color: Colors.warning,
  },
  primaryBg: {
    backgroundColor: Colors.primaryLight,
  },
  primaryText: {
    color: Colors.primaryDark,
  },
  neutralBg: {
    backgroundColor: Colors.surfaceSubtle,
  },
  neutralText: {
    color: Colors.textSecondary,
  },
});

