import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#059669" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
});
