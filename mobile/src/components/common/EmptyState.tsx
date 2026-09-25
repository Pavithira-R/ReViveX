import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Reviews Yet',
  description = 'Be the first to share your experience with this service provider!',
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>💬</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginVertical: 14,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
