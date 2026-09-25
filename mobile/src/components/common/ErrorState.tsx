import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>!</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Button
          title="Try Again"
          onPress={onRetry}
          variant="outline"
          style={styles.retryButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginVertical: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#B91C1C',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 38,
    borderColor: '#EF4444',
  },
});
