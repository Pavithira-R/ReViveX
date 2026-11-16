import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'danger' | 'secondary' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
}) => {
  const isDisabled = disabled || loading;

  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'outline':
        return styles.outlineContainer;
      case 'danger':
        return styles.dangerContainer;
      case 'secondary':
        return styles.secondaryContainer;
      case 'neutral':
        return styles.neutralContainer;
      default:
        return styles.primaryContainer;
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'outline':
        return styles.outlineText;
      case 'danger':
        return styles.dangerText;
      case 'secondary':
        return styles.secondaryText;
      case 'neutral':
        return styles.neutralText;
      default:
        return styles.primaryText;
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return styles.smContainer;
      case 'lg':
        return styles.lgContainer;
      default:
        return styles.mdContainer;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.baseContainer,
        getContainerStyle(),
        getSizeStyle(),
        isDisabled && styles.disabledContainer,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? Colors.primary : Colors.textWhite}
        />
      ) : (
        <Text style={[styles.baseText, getTextStyle()]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  smContainer: {
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm,
  },
  mdContainer: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
  },
  lgContainer: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  primaryContainer: {
    backgroundColor: Colors.primary,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  dangerContainer: {
    backgroundColor: Colors.danger,
  },
  secondaryContainer: {
    backgroundColor: Colors.secondary,
  },
  neutralContainer: {
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disabledContainer: {
    opacity: 0.5,
  },
  baseText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semibold,
  },
  primaryText: {
    color: Colors.textWhite,
  },
  outlineText: {
    color: Colors.primary,
  },
  dangerText: {
    color: Colors.textWhite,
  },
  secondaryText: {
    color: Colors.textWhite,
  },
  neutralText: {
    color: Colors.textPrimary,
  },
});

