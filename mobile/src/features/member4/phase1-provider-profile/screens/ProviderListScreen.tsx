import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ServiceProvider } from '../types';
import { mobileProviderService } from '../providerService';
import { ProviderCard } from '../components/ProviderCard';
import { MessageBanner, PrimaryButton } from '../../../../components';
import { COLORS, FONT, RADIUS, SPACING } from '../../../../constants';

interface ProviderListScreenProps {
  onSelectProvider: (provider: ServiceProvider) => void;
  onBack?: () => void;
}

const CATEGORIES = ['All', 'Laptops', 'Smartphones', 'Audio', 'Consoles', 'Tablets'];

export const ProviderListScreen: React.FC<ProviderListScreenProps> = ({ onSelectProvider, onBack }) => {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // The search box is applied when the user taps Search; a category change reuses the latest text.
  const searchRef = useRef(searchQuery);
  searchRef.current = searchQuery;

  const loadProviders = useCallback(async (searchText?: string, category?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const catParam = category && category !== 'All' ? category : undefined;
      const res = await mobileProviderService.fetchProviders({ search: searchText, category: catParam });
      if (res.success && res.data) {
        setProviders(res.data);
      } else {
        setError(res.error || 'Failed to load providers');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching providers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProviders(searchRef.current, activeCategory);
  }, [activeCategory, loadProviders]);

  const handleSearch = () => {
    loadProviders(searchQuery, activeCategory);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        {onBack ? (
          <Pressable onPress={onBack} accessibilityRole="button" hitSlop={12}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
        ) : (
          <View style={styles.topSpacer} />
        )}
        <Text style={styles.topTitle} numberOfLines={1}>
          Repair Service Providers
        </Text>
        <View style={styles.topSpacer} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search providers, skills, brands..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => { setSearchQuery(''); loadProviders('', activeCategory); }}>
              <Text style={styles.clearIcon}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Category Filter Chips */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => {
            const isSelected = activeCategory === item;
            return (
              <Pressable
                style={[styles.categoryChip, isSelected && styles.activeCategoryChip]}
                onPress={() => setActiveCategory(item)}
              >
                <Text style={[styles.categoryText, isSelected && styles.activeCategoryText]}>
                  {item}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : error ? (
        <View style={styles.errorBox}>
          <MessageBanner message={error} />
          <PrimaryButton title="Try again" variant="outlined" onPress={() => loadProviders(searchQuery, activeCategory)} />
        </View>
      ) : (
        <FlatList
          data={providers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProviderCard provider={item} onPress={onSelectProvider} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🔧</Text>
              <Text style={styles.emptyTitle}>No Providers Found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search query or choosing another category.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  back: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
    minWidth: 60,
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    flexShrink: 1,
    textAlign: 'center',
  },
  topSpacer: {
    minWidth: 60,
  },
  searchContainer: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  searchIcon: {
    marginRight: SPACING.xs,
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT.sm,
    color: COLORS.text,
    paddingVertical: SPACING.xs,
  },
  clearIcon: {
    color: COLORS.textMuted,
    fontSize: 14,
    padding: SPACING.xs,
  },
  categoryList: {
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  categoryChip: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSubtle,
  },
  activeCategoryChip: {
    backgroundColor: COLORS.primary,
  },
  categoryText: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  activeCategoryText: {
    color: COLORS.textWhite,
    fontWeight: '700',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  loader: {
    marginTop: 40,
  },
  errorBox: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    fontSize: FONT.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
});
