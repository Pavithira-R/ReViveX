// Member 2 – Item Management
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ItemAction } from '../types';

const actionColors: Record<string, string> = {
  REPAIR: '#FFF3E0',
  REUSE: '#E8F5E9',
  SELL: '#E3F2FD',
  DONATE: '#FCE4EC',
  RECYCLE: '#E0F2F1',
};

export const ActionBadge: React.FC<{ action: ItemAction | string }> = ({ action }) => (
  <View style={[styles.badge, { backgroundColor: actionColors[action] ?? '#EEF1EF' }]}>
    <Text style={styles.label}>{action.replaceAll('_', ' ')}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: 16, paddingHorizontal: 9, paddingVertical: 5 },
  label: { color: '#33413A', fontSize: 10, fontWeight: '700' },
});