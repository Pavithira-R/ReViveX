import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components';
import { APP_NAME, APP_TAGLINE, COLORS, ROLE_LABELS } from '../constants';
import { useAuth } from '../context';

interface HomeScreenProps {
  onOpenProfile: () => void;
  onOpenAdmin: () => void;
}

/**
 * Signed-in landing screen.
 * Placeholder until Member 2 integrates the real Home (post item, quick actions, etc.).
 */
export const HomeScreen: React.FC<HomeScreenProps> = ({ onOpenProfile, onOpenAdmin }) => {
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
            The rest of the app (posting items, repair, reuse and recycling) will appear here as
            each module is integrated.
          </Text>
        </View>

        <PrimaryButton title="My Profile" onPress={onOpenProfile} />
        {hasRole('ADMIN') ? (
          <PrimaryButton title="Manage Users" variant="outlined" onPress={onOpenAdmin} />
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
