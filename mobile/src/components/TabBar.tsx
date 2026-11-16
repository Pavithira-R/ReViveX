// Member 6 – Shared UI: bottom tab bar for the main sections of the app.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOW } from '../constants';
import { AppIcon } from './AppIcon';

export type TabKey = 'home' | 'discover' | 'messages' | 'profile';

/** Filled icon when the tab is active, outline otherwise (Material Design convention). */
const TABS: { key: TabKey; label: string; icon: string; activeIcon: string }[] = [
  { key: 'home', label: 'Home', icon: 'home-variant-outline', activeIcon: 'home-variant' },
  { key: 'discover', label: 'Discover', icon: 'compass-outline', activeIcon: 'compass' },
  { key: 'messages', label: 'Chats', icon: 'chat-outline', activeIcon: 'chat' },
  { key: 'profile', label: 'Profile', icon: 'account-circle-outline', activeIcon: 'account-circle' },
];

interface TabBarProps {
  active: TabKey;
  onSelect: (tab: TabKey) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ active, onSelect }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]} accessibilityRole="tablist">
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            accessibilityRole="tab"
            accessibilityLabel={`${tab.label} tab`}
            accessibilityState={{ selected: isActive }}
            style={styles.tab}
          >
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              <AppIcon
                name={isActive ? tab.activeIcon : tab.icon}
                size={22}
                color={isActive ? COLORS.primary : COLORS.textMuted}
              />
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    paddingTop: 6,
    ...SHADOW.raised,
  },
  tab: { flex: 1, alignItems: 'center' },
  iconWrap: { paddingHorizontal: 16, paddingVertical: 3, borderRadius: 14 },
  iconWrapActive: { backgroundColor: COLORS.primaryLight },
  label: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, fontWeight: '600' },
  labelActive: { color: COLORS.primary },
});
