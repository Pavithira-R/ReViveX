// Member 2 – Item Management
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants';
import { Item } from '../types';
import { ActionBadge } from './ActionBadge';
import { StatusBadge } from './StatusBadge';

interface ItemCardProps {
  item: Item;
  onPress: () => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onPress }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={`${item.name}${item.brand ? ` by ${item.brand}` : ''}`}
    onPress={onPress}
    style={({ pressed }) => [styles.card, pressed && styles.pressed]}
  >
    {item.images?.[0] ? (
      <Image source={{ uri: item.images[0] }} style={styles.image} />
    ) : (
      <View style={[styles.image, styles.placeholder]}>
        <Text style={styles.placeholderText}>No photo</Text>
      </View>
    )}
    <View style={styles.details}>
      <Text numberOfLines={1} style={styles.name}>{item.name}</Text>
      {item.brand ? <Text numberOfLines={1} style={styles.brand}>by {item.brand}</Text> : null}
      <View style={styles.badges}>
        <ActionBadge action={item.action} />
        <StatusBadge status={item.status} />
      </View>
    </View>
    <Text style={styles.chevron}>›</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 104,
    padding: 10,
  },
  pressed: { opacity: 0.84 },
  image: { backgroundColor: COLORS.primaryLight, borderRadius: 8, height: 78, width: 78 },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: COLORS.textMuted, fontSize: 10, fontWeight: '600' },
  details: { flex: 1, marginLeft: 12 },
  name: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  brand: { color: COLORS.textMuted, fontSize: 12, marginTop: 3 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chevron: { color: COLORS.textMuted, fontSize: 24, marginLeft: 5 },
});