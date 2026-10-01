import { StyleSheet, Text, View } from 'react-native';
import type { ItemAction } from '../services/api';

type Props = {
  action: ItemAction | string;
};

const ACTION_COLORS: Record<string, string> = {
  REPAIR: '#FFF3E0',
  REUSE: '#E8F5E9',
  SELL: '#E3F2FD',
  DONATE: '#FCE4EC',
  RECYCLE: '#F3E5F5',
};

export default function ActionBadge({ action }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: ACTION_COLORS[action] ?? '#EEEEEE' }]}>
      <Text style={styles.label}>{action.replaceAll('_', ' ')}</Text>
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
