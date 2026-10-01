import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Item } from '../services/api';
import ActionBadge from './ActionBadge';
import StatusBadge from './StatusBadge';

type Props = {
  item: Item;
  onPress: () => void;
};

export default function ItemCard({ item, onPress }: Props) {
  const imageUri = item.images?.[0];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.name}${item.brand ? ` by ${item.brand}` : ''}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={styles.placeholderText}>No Image</Text>
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
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E7ECE7',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 108,
    padding: 12,
  },
  pressed: {
    opacity: 0.82,
  },
  image: {
    backgroundColor: '#EDF2ED',
    borderRadius: 12,
    height: 80,
    width: 80,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#7A847B',
    fontSize: 11,
    fontWeight: '600',
  },
  details: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    color: '#202820',
    fontSize: 15,
    fontWeight: '700',
  },
  brand: {
    color: '#778078',
    fontSize: 12,
    marginTop: 3,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 9,
  },
  chevron: {
    color: '#9BA39C',
    fontSize: 25,
    marginLeft: 6,
  },
});
