import { StyleSheet, Text, View } from 'react-native';
import type { ItemStatus } from '../services/api';

type Props = {
  status: ItemStatus;
};

const STATUS_COLORS: Record<string, string> = {
  POSTED: '#FFF9C4',
  MATCHED: '#B3E5FC',
  ACCEPTED: '#C8E6C9',
  IN_PROGRESS: '#FFE0B2',
  COMPLETED: '#A5D6A7',
};

export default function StatusBadge({ status }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: STATUS_COLORS[status] ?? '#EEEEEE' }]}>
      <Text style={styles.label}>{status.replaceAll('_', ' ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  label: {
    color: '#344035',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
