import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ItemCard from '../components/ItemCard';
import { api, type Item } from '../services/api';
import type { MainTabParamList, RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'MyItems'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function MyItemsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      setItems(await api.items.getMyItems());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load your items.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadItems();
    }, [loadItems]),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            onPress={() => navigation.navigate('ItemDetails', { itemId: item.id })}
          />
        )}
        contentContainerStyle={[styles.listContent, !items.length && styles.emptyList]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            colors={['#2E7D32']}
            onRefresh={() => void loadItems(true)}
            refreshing={refreshing}
            tintColor="#2E7D32"
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>CIRCULAR LIVING</Text>
              <Text style={styles.title}>My Items</Text>
              <Text style={styles.subtitle}>Give your electronics a second life.</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('PostItem')}
              style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
            >
              <Text style={styles.addButtonText}>+ Post</Text>
            </Pressable>
            <Text style={styles.sectionTitle}>Your items ({items.length})</Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color="#2E7D32" size="large" style={styles.state} />
          ) : error ? (
            <View style={styles.state}>
              <Text style={styles.emptyTitle}>Couldn’t load your items</Text>
              <Text style={styles.emptyMessage}>{error}</Text>
              <Pressable onPress={() => void loadItems()} style={styles.retryButton}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.state}>
              <Text style={styles.emptyTitle}>No items yet</Text>
              <Text style={styles.emptyMessage}>Post an item and give it a second life.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9F7',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  emptyList: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 20,
  },
  eyebrow: {
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  title: {
    color: '#1B271C',
    fontSize: 30,
    fontWeight: '700',
  },
  subtitle: {
    color: '#687269',
    fontSize: 14,
    marginTop: 6,
  },
  addButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.82,
  },
  sectionTitle: {
    color: '#273329',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 28,
  },
  separator: {
    height: 12,
  },
  state: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 180,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: '#273329',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyMessage: {
    color: '#687269',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
