// Member 2 – Item Management
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants';

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <View style={styles.badge}>
    <Text style={styles.label}>{status.replaceAll('_', ' ')}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', backgroundColor: COLORS.primaryLight, borderRadius: 16, paddingHorizontal: 9, paddingVertical: 5 },
  label: { color: COLORS.primaryDark, fontSize: 10, fontWeight: '700' },
});