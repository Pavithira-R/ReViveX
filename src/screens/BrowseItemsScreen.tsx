import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ItemCard from '../components/ItemCard';
import { api, type Category, type Item, type ItemFilters } from '../services/api';
import type { MainTabParamList, RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Browse'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const ACTIONS = ['ALL', 'REPAIR', 'REUSE', 'SELL', 'DONATE', 'RECYCLE'] as const;

export default function BrowseItemsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<(typeof ACTIONS)[number]>('ALL');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.categories.getAll()
      .then((result) => {
        if (active) {
          setCategories(result);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setCategoryError(loadError instanceof Error ? loadError.message : 'Unable to load categories.');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const loadItems = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const filters: ItemFilters = {};
      if (selectedCategoryId && selectedCategoryId !== 'All') {
        filters.categoryId = selectedCategoryId;
      }
      if (selectedAction && selectedAction.toUpperCase() !== 'ALL') {
        filters.action = selectedAction;
      }
      if (searchText && searchText.trim().length > 0) {
        filters.search = searchText.trim();
      }
      setItems(await api.items.getAll(filters));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load items.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedAction, selectedCategoryId, searchText]);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => void loadItems(), 300);
      return () => clearTimeout(timer);
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
        contentContainerStyle={[styles.listContent, items.length === 0 && styles.emptyList]}
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
            <Text style={styles.title}>Browse items</Text>
            <TextInput
              accessibilityLabel="Search items"
              onChangeText={setSearchText}
              placeholder="Search by item or brand"
              placeholderTextColor="#98A098"
              style={styles.search}
              value={searchText}
            />
            <Text style={styles.filterLabel}>Category</Text>
            {categoryError ? <Text style={styles.filterError}>{categoryError}</Text> : null}
            <ScrollView horizontal contentContainerStyle={styles.chips} showsHorizontalScrollIndicator={false}>
              <FilterChip
                label="All"
                selected={!selectedCategoryId}
                onPress={() => setSelectedCategoryId(null)}
              />
              {categories.map((category) => (
                <FilterChip
                  key={category.id}
                  label={category.name}
                  selected={selectedCategoryId === category.id}
                  onPress={() => setSelectedCategoryId(category.id)}
                />
              ))}
            </ScrollView>
            <View style={styles.actionSelector}>
              <Text style={styles.filterLabel}>Action</Text>
              <ScrollView horizontal contentContainerStyle={styles.chips} showsHorizontalScrollIndicator={false}>
                {ACTIONS.map((option) => (
                  <FilterChip
                    key={option}
                    label={option}
                    selected={selectedAction === option}
                    onPress={() => setSelectedAction(option)}
                  />
                ))}
              </ScrollView>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color="#2E7D32" size="large" style={styles.state} />
          ) : error ? (
            <View style={styles.state}>
              <Text style={styles.emptyTitle}>Couldn’t load items</Text>
              <Text style={styles.emptyMessage}>{error}</Text>
              <Pressable onPress={() => void loadItems()} style={styles.retryButton}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.state}>
              <Text style={styles.emptyTitle}>No items found</Text>
              <Text style={styles.emptyMessage}>Try changing your search or filters.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.selectedChip, pressed && styles.pressed]}
    >
      <Text style={[styles.chipText, selected && styles.selectedChipText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F7F9F7',
    flex: 1,
  },
  listContent: {
    paddingBottom: 28,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  emptyList: {
    flexGrow: 1,
  },
  header: {
    paddingBottom: 20,
  },
  title: {
    color: '#1B271C',
    fontSize: 27,
    fontWeight: '700',
    marginBottom: 17,
  },
  search: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE5DD',
    borderRadius: 12,
    borderWidth: 1,
    color: '#202820',
    fontSize: 14,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  filterLabel: {
    color: '#273329',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 9,
  },
  filterError: {
    color: '#A22929',
    fontSize: 12,
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE5DD',
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 13,
  },
  selectedChip: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  chipText: {
    color: '#4C574D',
    fontSize: 11,
    fontWeight: '700',
  },
  selectedChipText: {
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.8,
  },
  actionSelector: {
    marginTop: 17,
  },
  separator: {
    height: 12,
  },
  state: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 180,
    paddingHorizontal: 18,
  },
  emptyTitle: {
    color: '#273329',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyMessage: {
    color: '#687269',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    marginTop: 13,
    paddingHorizontal: 17,
    paddingVertical: 9,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
