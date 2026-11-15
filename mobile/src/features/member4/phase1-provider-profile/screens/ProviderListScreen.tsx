import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { ServiceProvider } from '../types';
import { mobileProviderService } from '../providerService';
import { ProviderCard } from '../components/ProviderCard';
import { Colors, Spacing, BorderRadius, Typography } from '../../../theme';
import { Header } from '../../../components/common/Header';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { ErrorState } from '../../../components/common/ErrorState';

interface ProviderListScreenProps {
  onSelectProvider: (provider: ServiceProvider) => void;
}

const CATEGORIES = ['All', 'Laptops', 'Smartphones', 'Audio', 'Consoles', 'Tablets'];

export const ProviderListScreen: React.FC<ProviderListScreenProps> = ({ onSelectProvider }) => {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const loadProviders = async (query?: string, category?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const catParam = category && category !== 'All' ? category : undefined;
      const res = await mobileProviderService.fetchProviders({ search: query, category: catParam });
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
  };

  useEffect(() => {
    loadProviders(searchQuery, activeCategory);
  }, [activeCategory]);

  const handleSearch = () => {
    loadProviders(searchQuery, activeCategory);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Repair Service Providers"
        subtitle="Find certified electronics technicians"
      />

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search providers, skills, brands..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); loadProviders('', activeCategory); }}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
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
              <TouchableOpacity
                style={[styles.categoryChip, isSelected && styles.activeCategoryChip]}
                onPress={() => setActiveCategory(item)}
              >
                <Text style={[styles.categoryText, isSelected && styles.activeCategoryText]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {isLoading ? (
        <LoadingSpinner message="Searching verified providers..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadProviders(searchQuery, activeCategory)} />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  searchIcon: {
    marginRight: Spacing.xs,
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSizes.sm,
    color: Colors.textPrimary,
    paddingVertical: Spacing.xs,
  },
  clearIcon: {
    color: Colors.textMuted,
    fontSize: 14,
    padding: Spacing.xs,
  },
  categoryList: {
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  categoryChip: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSubtle,
  },
  activeCategoryChip: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeights.medium,
  },
  activeCategoryText: {
    color: Colors.textWhite,
    fontWeight: Typography.fontWeights.bold,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
});
