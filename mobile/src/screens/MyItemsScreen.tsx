// Member 2 – Item Management
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ItemCard, MessageBanner, PrimaryButton } from '../components';
import { COLORS } from '../constants';
import { itemService } from '../services';
import { Item } from '../types';
import { getErrorMessage } from '../utils';

interface MyItemsScreenProps {
  onBack: () => void;
  onCreateItem: () => void;
  onOpenItem: (id: string) => void;
}

export const MyItemsScreen: React.FC<MyItemsScreenProps> = ({ onBack, onCreateItem, onOpenItem }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);
    try {
      setItems(await itemService.mine());
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Could not load your items.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.topTitle}>My Items</Text>
        <View style={styles.topSpacer} />
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ItemCard item={item} onPress={() => onOpenItem(item.id)} />}
        contentContainerStyle={[styles.content, items.length === 0 && styles.emptyContent]}
        ItemSeparatorComponent={ItemSeparator}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.subtitle}>Your devices and their next steps.</Text>
            <PrimaryButton title="Post an Item" onPress={onCreateItem} />
            <Text style={styles.sectionTitle}>Your items ({items.length})</Text>
            <MessageBanner message={errorMessage} />
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={COLORS.primary} style={styles.state} />
          ) : errorMessage ? (
            <View style={styles.state}>
              <PrimaryButton title="Try again" variant="outlined" onPress={load} />
            </View>
          ) : (
            <View style={styles.state}>
              <Text style={styles.emptyTitle}>No items yet</Text>
              <Text style={styles.emptyMessage}>Post a device to give it another life.</Text>
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  topBar: { alignItems: 'center', backgroundColor: COLORS.surface, borderBottomColor: COLORS.border, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  back: { color: COLORS.primary, fontSize: 16, fontWeight: '600', minWidth: 60 },
  topTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700' },
  topSpacer: { minWidth: 60 },
  content: { padding: 18, paddingBottom: 30 },
  emptyContent: { flexGrow: 1 },
  header: { paddingBottom: 14 },
  subtitle: { color: COLORS.textMuted, fontSize: 14, marginBottom: 5 },
  sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700', marginTop: 22, marginBottom: 8 },
  separator: { height: 10 },
  state: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 180, paddingHorizontal: 18 },
  emptyTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptyMessage: { color: COLORS.textMuted, fontSize: 14, lineHeight: 20, marginTop: 7, textAlign: 'center' },
});

export default MyItemsScreen;