import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ActionBadge from '../components/ActionBadge';
import StatusBadge from '../components/StatusBadge';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { api, type Item } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'ItemDetails'>;

export default function ItemDetailsScreen({ navigation, route }: Props) {
  const { itemId } = route.params;
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.items.getById(itemId)
      .then((result) => {
        if (active) {
          setItem(result);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load this item.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [itemId]);

  const deleteItem = async () => {
    setDeleting(true);
    try {
      await api.items.delete(itemId);
      navigation.goBack();
    } catch (deleteError) {
      Alert.alert(
        'Could not delete item',
        deleteError instanceof Error ? deleteError.message : 'Please try again.',
      );
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete this item?',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => void deleteItem() },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#2E7D32" size="large" />
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Couldn’t load this item</Text>
        <Text style={styles.errorText}>{error ?? 'Item was not found.'}</Text>
      </View>
    );
  }

  const imageUri = item.images?.[0];
  const createdDate = new Date(item.createdAt);
  const postedDate = Number.isNaN(createdDate.getTime())
    ? 'Unknown date'
    : createdDate.toLocaleDateString();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.heroImage} />
        ) : (
          <View style={[styles.heroImage, styles.placeholder]}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        <Text style={styles.name}>{item.name}</Text>
        {item.brand ? <Text style={styles.brand}>by {item.brand}</Text> : null}
        <View style={styles.badges}>
          <ActionBadge action={item.action} />
          <StatusBadge status={item.status} />
        </View>

        <View style={styles.infoCard}>
          <DetailRow label="Category" value={item.category?.name ?? 'Uncategorized'} />
          <DetailRow label="Condition" value={item.condition.replaceAll('_', ' ')} />
          <DetailRow label="Posted by" value={item.owner?.name ?? 'Member'} />
          <DetailRow label="Posted" value={postedDate} />
        </View>

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{item.description?.trim() || 'No description provided.'}</Text>

        <Pressable
          accessibilityRole="button"
          disabled={deleting}
          onPress={confirmDelete}
          style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed, deleting && styles.disabled]}
        >
          {deleting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.deleteText}>Delete item</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9F7',
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    color: '#273329',
    fontSize: 17,
    fontWeight: '700',
  },
  errorText: {
    color: '#687269',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  heroImage: {
    backgroundColor: '#EAF0EA',
    borderRadius: 18,
    height: 260,
    width: '100%',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#7A847B',
    fontSize: 14,
    fontWeight: '600',
  },
  name: {
    color: '#202820',
    fontSize: 26,
    fontWeight: '700',
    marginTop: 20,
  },
  brand: {
    color: '#778078',
    fontSize: 15,
    marginTop: 4,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E7ECE7',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 22,
    paddingHorizontal: 15,
  },
  detailRow: {
    alignItems: 'center',
    borderBottomColor: '#EFF2EF',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  detailLabel: {
    color: '#778078',
    fontSize: 13,
  },
  detailValue: {
    color: '#273329',
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 12,
    textAlign: 'right',
  },
  sectionTitle: {
    color: '#273329',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 24,
  },
  description: {
    color: '#687269',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: '#C62828',
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 30,
    minHeight: 52,
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.6,
  },
});
