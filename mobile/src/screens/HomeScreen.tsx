import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components';
import { APP_NAME, APP_TAGLINE, COLORS, ROLE_LABELS } from '../constants';
import { useAuth } from '../context';

interface HomeScreenProps {
  onOpenProfile: () => void;
  onOpenEcoImpact: () => void;
  onOpenNotifications: () => void;
  onOpenMessages: () => void;
  onOpenAdmin: () => void;
  onOpenProblemReports: () => void;
  onOpenDiscovery?: () => void;
  onOpenPostItem: () => void;
  onOpenMyItems: () => void;
  onOpenBrowseItems: () => void;
}

/**
 * Signed-in landing screen.
 * Placeholder until Member 2 integrates the real Home (post item, quick actions, etc.).
 */
export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenProfile,
  onOpenEcoImpact,
  onOpenNotifications,
  onOpenMessages,
  onOpenAdmin,
  onOpenProblemReports,
  onOpenDiscovery,
  onOpenPostItem,
  onOpenMyItems,
  onOpenBrowseItems,
}) => {
  const { user, hasRole } = useAuth();
  if (!user) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.logo}>{APP_NAME}</Text>
        <Text style={styles.tagline}>{APP_TAGLINE}</Text>

        <View style={styles.card}>
          <Text style={styles.greeting}>Hello, {user.name.split(' ')[0]} 👋</Text>
          <Text style={styles.meta}>Signed in as {ROLE_LABELS[user.role]}</Text>
          <Text style={styles.body}>
            Post a device, manage your items, or browse what the community has shared.
          </Text>
        </View>

        <PrimaryButton title="Post an Item" onPress={onOpenPostItem} />
        <PrimaryButton title="My Items" variant="outlined" onPress={onOpenMyItems} />
        <PrimaryButton title="Browse Items" variant="outlined" onPress={onOpenBrowseItems} />
        <PrimaryButton title="My Profile" onPress={onOpenProfile} />
        <PrimaryButton title="Messages" variant="outlined" onPress={onOpenMessages} />
        <PrimaryButton title="Notifications" variant="outlined" onPress={onOpenNotifications} />
        <PrimaryButton title="My Eco Impact" variant="outlined" onPress={onOpenEcoImpact} />
        {onOpenDiscovery && (
          <PrimaryButton
            title="Explore Discovery & Recommendations"
            variant="outlined"
            onPress={onOpenDiscovery}
          />
        )}
        {hasRole('ADMIN') ? (
          <>
            <PrimaryButton title="Manage Users" variant="outlined" onPress={onOpenAdmin} />
            <PrimaryButton title="Problem Reports" variant="outlined" onPress={onOpenProblemReports} />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24 },
  logo: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  tagline: { fontSize: 14, color: COLORS.textMuted, marginBottom: 24 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    marginBottom: 12,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  meta: { fontSize: 14, color: COLORS.primary, fontWeight: '600', marginTop: 4 },
  body: { fontSize: 15, color: COLORS.textMuted, marginTop: 12, lineHeight: 22 },
});

export default HomeScreen;
