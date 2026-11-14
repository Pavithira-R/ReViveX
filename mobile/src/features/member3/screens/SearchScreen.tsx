// ============================================================================
// Member 3 - SearchScreen Component
// Interactive Search Input, Recent Searches, Categories, and Trending Tags
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { DeviceCategory, SearchFilters } from '../types';
import { SearchBarHeader } from '../components/SearchBarHeader';
import { CATEGORY_META, COLORS, RADIUS, SPACING } from '../constants/theme';

interface SearchScreenProps {
  initialQuery?: string;
  onSearch: (filters: Partial<SearchFilters>) => void;
  onBack: () => void;
}

const CATEGORIES: DeviceCategory[] = [
  'LAPTOP',
  'PHONE',
  'TABLET',
  'DESKTOP',
  'MONITOR',
  'PRINTER',
  'OTHER',
];

const INITIAL_RECENT_SEARCHES = [
  'ThinkPad T480',
  'iPhone screen repair',
  'Free monitor donation',
  'Certified e-waste bin',
];

const TRENDING_SEARCHES = [
  'MacBook battery replacement',
  'iPad Air for school',
  'Component repair lab',
  'Dell monitor IPS',
  'HP laser printer repair',
];

export const SearchScreen: React.FC<SearchScreenProps> = ({
  initialQuery = '',
  onSearch,
  onBack,
}) => {
  const [query, setQuery] = useState<string>(initialQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>(INITIAL_RECENT_SEARCHES);

  const handleExecuteSearch = (q: string, category?: DeviceCategory) => {
    const trimmed = q.trim();
    if (trimmed && !recentSearches.includes(trimmed)) {
      setRecentSearches((prev) => [trimmed, ...prev.slice(0, 5)]);
    }
    onSearch({
      query: trimmed || undefined,
      category,
      page: 1,
    });
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
  };

  return (
    <View style={styles.container}>
      {/* Top Search Bar */}
      <SearchBarHeader
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => handleExecuteSearch(query)}
        onClear={() => setQuery('')}
        onPressBack={onBack}
        autoFocus
        placeholder="Search devices, repair, listings..."
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Browse by Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((cat) => {
              const meta = CATEGORY_META[cat];
              return (
                <TouchableOpacity
                  key={cat}
                  style={styles.categoryCard}
                  onPress={() => handleExecuteSearch(query, cat)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.catIcon}>{meta.icon}</Text>
                  <Text style={styles.catLabel}>{meta.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={handleClearRecent} activeOpacity={0.7}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.chipsRow}>
              {recentSearches.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.recentChip}
                  onPress={() => {
                    setQuery(item);
                    handleExecuteSearch(item);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.clockIcon}>🕒</Text>
                  <Text style={styles.recentText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Trending Searches */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Trending on ReViveX</Text>
          <View style={styles.chipsRow}>
            {TRENDING_SEARCHES.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.trendingChip}
                onPress={() => {
                  setQuery(item);
                  handleExecuteSearch(item);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.trendingText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    gap: SPACING.xl,
  },
  section: {},
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  clearText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryCard: {
    width: '31%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  catLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clockIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  recentText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  trendingChip: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  trendingText: {
    fontSize: 12,
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
});
