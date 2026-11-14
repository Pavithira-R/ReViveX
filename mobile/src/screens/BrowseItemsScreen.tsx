// Member 2 – Item Management
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChipSelector, FormInput, ItemCard, MessageBanner, PrimaryButton } from '../components';
import { COLORS } from '../constants';
import { itemService } from '../services';
import { Category, Item, ItemAction, ItemCondition, ItemFilters } from '../types';
import { getErrorMessage } from '../utils';

interface BrowseItemsScreenProps {
  onBack: () => void;
  onOpenItem: (id: string) => void;
}

const actions = ['REPAIR', 'REUSE', 'SELL', 'DONATE', 'RECYCLE'] as const;
const conditions = ['WORKING', 'DAMAGED', 'BROKEN'] as const;

export const BrowseItemsScreen: React.FC<BrowseItemsScreenProps> = ({ onBack, onOpenItem }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [action, setAction] = useState<ItemAction | null>(null);
  const [condition, setCondition] = useState<ItemCondition | null>(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setCategoryError(null);
    try {
      setCategories(await itemService.categories());
    } catch (error) {
      setCategoryError(getErrorMessage(error, 'Could not load categories.'));
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const loadItems = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);
    try {
      const filters: ItemFilters = {
        categoryId: categoryId ?? undefined,
        action: action ?? undefined,
        condition: condition ?? undefined,
        search: search.trim() || undefined,
      };
      setItems(await itemService.list(filters));
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Could not load items.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [action, categoryId, condition, search]);

  useEffect(() => {
    const timer = setTimeout(() => loadItems(), search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [loadItems, search]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.topTitle}>Browse Items</Text>
        <View style={styles.topSpacer} />
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ItemCard item={item} onPress={() => onOpenItem(item.id)} />}
        contentContainerStyle={[styles.content, items.length === 0 && styles.emptyContent]}
        ItemSeparatorComponent={ItemSeparator}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadItems(true)} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <FormInput label="Search" value={search} onChangeText={setSearch} placeholder="Item, brand or description" returnKeyType="search" />
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Category</Text>
              {categoryError ? <Pressable onPress={loadCategories}><Text style={styles.retry}>Retry</Text></Pressable> : null}
            </View>
            <MessageBanner message={categoryError} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <FilterChip label="All" selected={!categoryId} onPress={() => setCategoryId(null)} />
              {categories.map((category) => (
                <FilterChip key={category.id} label={category.name} selected={categoryId === category.id} onPress={() => setCategoryId(category.id)} />
              ))}
            </ScrollView>
            <ChipSelector
              label="Action"
              options={actions}
              selected={action}
              onSelect={(value) => setAction((current) => current === value ? null : value)}
            />
            <ChipSelector
              label="Condition"
              options={conditions}
              selected={condition}
              onSelect={(value) => setCondition((current) => current === value ? null : value)}
            />
            <MessageBanner message={errorMessage} />
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={COLORS.primary} style={styles.state} />
          ) : errorMessage ? (
            <View style={styles.state}><PrimaryButton title="Try again" variant="outlined" onPress={loadItems} /></View>
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
};

function ItemSeparator() {
  return <View style={styles.separator} />;
}

function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
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
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  topBar: { alignItems: 'center', backgroundColor: COLORS.surface, borderBottomColor: COLORS.border, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  back: { color: COLORS.primary, fontSize: 16, fontWeight: '600', minWidth: 60 },
  topTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700' },
  topSpacer: { minWidth: 60 },
  content: { padding: 18, paddingBottom: 30 },
  emptyContent: { flexGrow: 1 },
  header: { paddingBottom: 8 },
  filterHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  filterTitle: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginBottom: 9 },
  retry: { color: COLORS.primary, fontSize: 13, fontWeight: '700', marginBottom: 9 },
  chips: { flexDirection: 'row', gap: 8, paddingRight: 18, paddingBottom: 18 },
  chip: { alignItems: 'center', backgroundColor: COLORS.surface, borderColor: COLORS.border, borderRadius: 18, borderWidth: 1, justifyContent: 'center', minHeight: 36, paddingHorizontal: 12 },
  selectedChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700' },
  selectedChipText: { color: '#FFFFFF' },
  pressed: { opacity: 0.8 },
  separator: { height: 10 },
  state: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 180, paddingHorizontal: 18 },
  emptyTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptyMessage: { color: COLORS.textMuted, fontSize: 14, lineHeight: 20, marginTop: 7, textAlign: 'center' },
});

export default BrowseItemsScreen;