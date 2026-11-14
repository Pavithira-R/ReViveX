// ============================================================================
// Member 3 - SearchResultsScreen Component
// Tabbed search results (All, Providers, Listings, Recycling), filters & pagination
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {
  SearchFilters,
  UnifiedSearchResults,
  ServiceProviderSummary,
  ListingSummary,
  RecyclePointSummary,
} from '../types';
import { searchUnified } from '../services/searchService';
import { getLocationState } from '../services/locationService';
import { SearchBarHeader } from '../components/SearchBarHeader';
import { MultiFacetFilterModal } from '../components/MultiFacetFilterModal';
import { ProviderCard } from '../components/ProviderCard';
import { ListingCard } from '../components/ListingCard';
import { RecyclePointCard } from '../components/RecyclePointCard';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

interface SearchResultsScreenProps {
  initialFilters: SearchFilters;
  onSelectProvider?: (provider: ServiceProviderSummary) => void;
  onSelectListing?: (listing: ListingSummary) => void;
  onSelectRecyclePoint?: (point: RecyclePointSummary) => void;
  onNavigateToQuestionnaire?: () => void;
  onBack: () => void;
}

type TabType = 'ALL' | 'PROVIDERS' | 'LISTINGS' | 'RECYCLING';

export const SearchResultsScreen: React.FC<SearchResultsScreenProps> = ({
  initialFilters,
  onSelectProvider,
  onSelectListing,
  onSelectRecyclePoint,
  onNavigateToQuestionnaire,
  onBack,
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    ...initialFilters,
    latitude: initialFilters.latitude ?? getLocationState().coordinates.latitude,
    longitude: initialFilters.longitude ?? getLocationState().coordinates.longitude,
    page: 1,
    limit: 10,
  });

  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [filterModalVisible, setFilterModalVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [results, setResults] = useState<UnifiedSearchResults | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);

  // Execute Search
  const executeSearch = useCallback(
    async (searchFilters: SearchFilters, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const response = await searchUnified(searchFilters);
        setIsOffline(response.isOfflineFallback);

        if (append && results) {
          setResults({
            ...response.data,
            providers: [...results.providers, ...response.data.providers],
            listings: [...results.listings, ...response.data.listings],
            recyclePoints: [...results.recyclePoints, ...response.data.recyclePoints],
          });
        } else {
          setResults(response.data);
        }
      } catch (err) {
        console.error('Unified search failed:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [results]
  );

  useEffect(() => {
    executeSearch(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.query, filters.category, filters.condition, filters.actionType, filters.radiusKm, filters.minPrice, filters.maxPrice, filters.minRating]);

  const handleLoadMore = () => {
    if (results?.hasMore && !loadingMore && !loading) {
      const nextPage = (filters.page || 1) + 1;
      const updated = { ...filters, page: nextPage };
      setFilters(updated);
      executeSearch(updated, true);
    }
  };

  const handleApplyFilters = (newFilters: SearchFilters) => {
    setFilterModalVisible(false);
    setFilters(newFilters);
  };

  // Count active filters
  let activeFilterCount = 0;
  if (filters.category) activeFilterCount++;
  if (filters.condition) activeFilterCount++;
  if (filters.actionType && filters.actionType !== 'ALL') activeFilterCount++;
  if (filters.radiusKm !== undefined) activeFilterCount++;
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) activeFilterCount++;
  if (filters.minRating !== undefined) activeFilterCount++;

  const providers = results?.providers || [];
  const listings = results?.listings || [];
  const recyclePoints = results?.recyclePoints || [];

  const tabCounts = {
    ALL: providers.length + listings.length + recyclePoints.length,
    PROVIDERS: providers.length,
    LISTINGS: listings.length,
    RECYCLING: recyclePoints.length,
  };

  return (
    <View style={styles.container}>
      {/* Search Header Bar */}
      <SearchBarHeader
        value={filters.query || ''}
        placeholder="Search devices, repair, listings..."
        onChangeText={(text) => setFilters((prev) => ({ ...prev, query: text }))}
        onSubmitEditing={() => executeSearch(filters)}
        onClear={() => {
          const cleared = { ...filters, query: undefined, page: 1 };
          setFilters(cleared);
          executeSearch(cleared);
        }}
        onPressBack={onBack}
        onPressFilter={() => setFilterModalVisible(true)}
        activeFilterCount={activeFilterCount}
      />

      {/* Offline Banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            ⚡ Offline Mode: Searching curated local database
          </Text>
        </View>
      )}

      {/* Tabs Row */}
      <View style={styles.tabsRow}>
        {(['ALL', 'PROVIDERS', 'LISTINGS', 'RECYCLING'] as TabType[]).map((tab) => {
          const isSelected = activeTab === tab;
          const count = tabCounts[tab];
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, isSelected && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.tabButtonText, isSelected && styles.tabButtonTextActive]}
              >
                {tab.charAt(0) + tab.slice(1).toLowerCase()} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Results List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Searching ReViveX circular network...</Text>
        </View>
      ) : tabCounts[activeTab] === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No matching results</Text>
          <Text style={styles.emptySubtitle}>
            We couldn't find any items matching your active criteria. Try broadening your radius or clearing filters.
          </Text>
          <TouchableOpacity
            style={styles.resetFiltersBtn}
            onPress={() => {
              const reset: SearchFilters = {
                query: undefined,
                page: 1,
                limit: 10,
              };
              setFilters(reset);
              executeSearch(reset);
            }}
          >
            <Text style={styles.resetFiltersText}>Reset All Filters</Text>
          </TouchableOpacity>

          {onNavigateToQuestionnaire && (
            <TouchableOpacity
              style={styles.wizardPromptBtn}
              onPress={onNavigateToQuestionnaire}
            >
              <Text style={styles.wizardPromptText}>
                💡 Try the 60s Recommendation Wizard instead →
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={[1]} // Single wrapper data to render tabbed sections smoothly
          keyExtractor={() => 'search_content'}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={() => (
            <View>
              {/* Providers Section */}
              {(activeTab === 'ALL' || activeTab === 'PROVIDERS') &&
                providers.length > 0 && (
                  <View style={styles.sectionBlock}>
                    {activeTab === 'ALL' && (
                      <Text style={styles.bucketTitle}>
                        Repair Providers ({providers.length})
                      </Text>
                    )}
                    {providers.map((p) => (
                      <ProviderCard
                        key={p.id}
                        provider={p}
                        onPress={() => onSelectProvider?.(p)}
                      />
                    ))}
                  </View>
                )}

              {/* Listings Section */}
              {(activeTab === 'ALL' || activeTab === 'LISTINGS') &&
                listings.length > 0 && (
                  <View style={styles.sectionBlock}>
                    {activeTab === 'ALL' && (
                      <Text style={styles.bucketTitle}>
                        Marketplace & Reuse Listings ({listings.length})
                      </Text>
                    )}
                    {listings.map((l) => (
                      <ListingCard
                        key={l.id}
                        listing={l}
                        onPress={() => onSelectListing?.(l)}
                      />
                    ))}
                  </View>
                )}

              {/* Recycling Section */}
              {(activeTab === 'ALL' || activeTab === 'RECYCLING') &&
                recyclePoints.length > 0 && (
                  <View style={styles.sectionBlock}>
                    {activeTab === 'ALL' && (
                      <Text style={styles.bucketTitle}>
                        Certified E-Waste Drop-Offs ({recyclePoints.length})
                      </Text>
                    )}
                    {recyclePoints.map((r) => (
                      <RecyclePointCard
                        key={r.id}
                        point={r}
                        onPress={() => onSelectRecyclePoint?.(r)}
                      />
                    ))}
                  </View>
                )}

              {/* Load More Button */}
              {results?.hasMore && (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={handleLoadMore}
                  disabled={loadingMore}
                  activeOpacity={0.8}
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Text style={styles.loadMoreText}>Load More Results ↓</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}

      {/* Multi-Facet Filter Modal */}
      <MultiFacetFilterModal
        visible={filterModalVisible}
        filters={filters}
        onApply={handleApplyFilters}
        onClose={() => setFilterModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  offlineBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 4,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  offlineText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
  },
  tabButton: {
    paddingVertical: SPACING.md,
    marginRight: SPACING.lg,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: COLORS.primary,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabButtonTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  resetFiltersBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  resetFiltersText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  wizardPromptBtn: {
    paddingVertical: SPACING.sm,
  },
  wizardPromptText: {
    fontSize: 13,
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.xxxl,
  },
  sectionBlock: {
    marginBottom: SPACING.md,
  },
  bucketTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  loadMoreButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
