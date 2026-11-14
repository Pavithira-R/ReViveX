import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components';
import {
  APP_NAME,
  APP_TAGLINE,
  COLORS,
  ROLE_LABELS,
} from '../constants';

import { useAuth } from '../context';

interface HomeScreenProps {
  onOpenProfile: () => void;
  onOpenEcoImpact: () => void;
  onOpenAdmin: () => void;
  onOpenReuseRecycle: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenProfile,
  onOpenEcoImpact,
  onOpenAdmin,
  onOpenReuseRecycle,
}) => {
  const { user, hasRole } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.logo}>{APP_NAME}</Text>

        <Text style={styles.tagline}>
          {APP_TAGLINE}
        </Text>

        <View style={styles.card}>
          <Text style={styles.greeting}>
            Hello, {user.name.split(' ')[0]} 👋
          </Text>

          <Text style={styles.meta}>
            Signed in as {ROLE_LABELS[user.role]}
          </Text>

          <Text style={styles.body}>
            Welcome to ReViveX! Give items a second life,
            reduce waste, and make a positive environmental
            impact.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          Explore ReViveX
        </Text>

        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>
            ♻️ Reuse & Recycle
          </Text>

          <Text style={styles.featureDescription}>
            Browse reusable items, create listings, make
            offers, and request recycling collections.
          </Text>

          <PrimaryButton
            title="Open Reuse & Recycle"
            onPress={onOpenReuseRecycle}
          />
        </View>

        <Text style={styles.sectionTitle}>
          My Account
        </Text>

        <PrimaryButton
          title="My Profile"
          onPress={onOpenProfile}
        />

        <PrimaryButton
          title="My Eco Impact"
          variant="outlined"
          onPress={onOpenEcoImpact}
        />

        {hasRole('ADMIN') ? (
          <PrimaryButton
            title="Manage Users"
            variant="outlined"
            onPress={onOpenAdmin}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    padding: 24,
    paddingBottom: 40,
  },

  logo: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
  },

  tagline: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 24,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    marginBottom: 24,
  },

  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },

  meta: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 4,
  },

  body: {
    fontSize: 15,
    color: COLORS.textMuted,
    marginTop: 12,
    lineHeight: 22,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    marginTop: 8,
  },

  featureCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    marginBottom: 24,
  },

  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },

  featureDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 21,
    marginBottom: 16,
  },
});

export default HomeScreen;