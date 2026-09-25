import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const isInteractive = !loading && !disabled;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={isInteractive ? onPress : undefined}
      style={[
        styles.button,
        variant === 'primary' && styles.primaryButton,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'outline' && styles.outlineButton,
        (disabled || loading) && styles.disabledButton,
        style,
      ]}
      disabled={!isInteractive}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? '#10B981' : '#FFFFFF'}
        />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === 'primary' && styles.primaryText,
            variant === 'secondary' && styles.secondaryText,
            variant === 'outline' && styles.outlineText,
            disabled && styles.disabledText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: '#059669', // Emerald/Sustainability green
  },
  secondaryButton: {
    backgroundColor: '#374151',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#059669',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    borderColor: '#9CA3AF',
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#FFFFFF',
  },
  outlineText: {
    color: '#059669',
  },
  disabledText: {
    color: '#F3F4F6',
  },
});
