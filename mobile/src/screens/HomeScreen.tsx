// Member 6 – Home dashboard (shared UI / integration): greeting, eco points, quick actions.
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '../components';
import { APP_NAME, COLORS, FONT, RADIUS, ROLE_LABELS, SHADOW, SPACING } from '../constants';
import { useAuth } from '../context';
import { chatService, ecoService, notificationService } from '../services';
import { EcoSummary } from '../types';

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
  onOpenReuseRecycle?: () => void;
  onOpenRepair?: () => void;
  onOpenProviderRequests?: () => void;
  onOpenProviderProfileEdit?: () => void;
}

const BADGE_LABELS: Record<EcoSummary['badge'], string> = {
  NONE: 'No badge yet',
  BRONZE: 'Bronze',
  SILVER: 'Silver',
  GOLD: 'Gold',
};

const greetingFor = (hour: number) => (hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening');

/** Signed-in landing screen: what's new, your impact, and everything you can do. */
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
  onOpenReuseRecycle,
  onOpenRepair,
  onOpenProviderRequests,
  onOpenProviderProfileEdit,
}) => {
  const { user, hasRole } = useAuth();
  const [eco, setEco] = useState<EcoSummary | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /** Each part loads on its own; one failing (e.g. offline) never blocks the rest. */
  const load = useCallback(async () => {
    const [ecoResult, notificationResult, chatResult] = await Promise.allSettled([
      ecoService.getMine(),
      notificationService.list(),
      chatService.list(),
    ]);
    if (ecoResult.status === 'fulfilled') setEco(ecoResult.value);
    if (notificationResult.status === 'fulfilled') setUnreadNotifications(notificationResult.value.unreadCount);
    if (chatResult.status === 'fulfilled') {
      setUnreadMessages(chatResult.value.reduce((sum, chat) => sum + chat.unreadCount, 0));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  };

  if (!user) return null;
  const firstName = user.name.split(' ')[0];
  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
  const progress = eco?.nextBadge
    ? Math.min(1, eco.totalPoints / (eco.totalPoints + eco.nextBadge.pointsNeeded))
    : eco
      ? 1
      : 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={COLORS.primary} />}
      >
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.brand}>{APP_NAME}</Text>
            <View style={styles.heroActions}>
              <Pressable
                onPress={onOpenNotifications}
                accessibilityRole="button"
                accessibilityLabel="Notifications"
                hitSlop={8}
                style={styles.iconButton}
              >
                <AppIcon name="bell-outline" size={22} color="#FFFFFF" />
                {unreadNotifications > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</Text>
                  </View>
                ) : null}
              </Pressable>
              <Pressable
                onPress={onOpenProfile}
                accessibilityRole="button"
                accessibilityLabel="My Profile"
                hitSlop={8}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{initials || '?'}</Text>
              </Pressable>
            </View>
          </View>
          <Text style={styles.greetingSmall}>{greetingFor(new Date().getHours())}</Text>
          <Text style={styles.greeting}>Hello, {firstName}</Text>
          <View style={styles.roleChip}>
            <Text style={styles.roleChipText}>{ROLE_LABELS[user.role]}</Text>
          </View>
        </View>

        <Pressable
          onPress={onOpenEcoImpact}
          accessibilityRole="button"
          accessibilityLabel="My Eco Impact"
          style={({ pressed }) => [styles.ecoCard, pressed && styles.pressed]}
        >
          <View style={styles.ecoRow}>
            <View>
              <Text style={styles.ecoLabel}>Your eco points</Text>
              <Text style={styles.ecoPoints}>{eco ? eco.totalPoints : '–'}</Text>
            </View>
            <View style={styles.ecoBadge}>
              <AppIcon name="leaf" size={16} color={COLORS.primaryDark} />
              <Text style={styles.ecoBadgeText}>{eco ? BADGE_LABELS[eco.badge] : 'Loading'}</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { flex: progress }]} />
            <View style={{ flex: 1 - progress }} />
          </View>
          <Text style={styles.ecoHint}>
            {eco?.nextBadge
              ? `${eco.nextBadge.pointsNeeded} points to ${BADGE_LABELS[eco.nextBadge.badge]} · about ${eco.impact.co2SavedKg} kg CO2 saved`
              : eco
                ? `Top badge reached · about ${eco.impact.co2SavedKg} kg CO2 saved`
                : 'Repair, reuse, donate or recycle to earn points.'}
          </Text>
        </Pressable>

        <Text style={styles.sectionTitle}>What would you like to do?</Text>
        <View style={styles.grid}>
          <Tile label="Post an Item" hint="Add a device" icon="camera-plus-outline" tint="green" onPress={onOpenPostItem} primary />
          <Tile label="Browse Items" hint="See what's shared" icon="magnify" tint="blue" onPress={onOpenBrowseItems} />
          {onOpenDiscovery ? (
            <Tile label="Explore Discovery" hint="Recommendations" icon="compass-outline" tint="purple" onPress={onOpenDiscovery} />
          ) : null}
          {onOpenRepair ? (
            <Tile label="Repair" hint="Find a technician" icon="wrench-outline" tint="amber" onPress={onOpenRepair} />
          ) : null}
          {onOpenReuseRecycle ? (
            <Tile label="Reuse & Recycle" hint="Sell, donate, recycle" icon="recycle" tint="teal" onPress={onOpenReuseRecycle} />
          ) : null}
          <Tile label="My Items" hint="Your devices" icon="package-variant-closed" tint="rose" onPress={onOpenMyItems} />
          <Tile
            label="Messages"
            hint={unreadMessages ? `${unreadMessages} unread` : 'Chat with members'}
            icon="chat-outline"
            tint="blue"
            onPress={onOpenMessages}
          />
        </View>

        {hasRole('SERVICE_PROVIDER') || hasRole('ADMIN') ? (
          <>
            <Text style={styles.sectionTitle}>Technician Portal</Text>
            <View style={styles.grid}>
              {onOpenProviderRequests ? (
                <Tile
                  label="Repair Jobs"
                  hint="Incoming requests & quotes"
                  icon="clipboard-list-outline"
                  tint="amber"
                  onPress={onOpenProviderRequests}
                />
              ) : null}
              {onOpenProviderProfileEdit ? (
                <Tile
                  label="Business Profile"
                  hint="Services, rates & city"
                  icon="store-edit-outline"
                  tint="blue"
                  onPress={onOpenProviderProfileEdit}
                />
              ) : null}
            </View>
          </>
        ) : null}

        {hasRole('RECYCLER') || hasRole('ADMIN') ? (
          <>
            <Text style={styles.sectionTitle}>Recycler Portal</Text>
            <View style={styles.grid}>
              {onOpenReuseRecycle ? (
                <Tile
                  label="E-Waste Pickups"
                  hint="Accept & manage pickups"
                  icon="truck-delivery-outline"
                  tint="teal"
                  onPress={onOpenReuseRecycle}
                />
              ) : null}
            </View>
          </>
        ) : null}

        {hasRole('ADMIN') ? (
          <>
            <Text style={styles.sectionTitle}>Admin</Text>
            <View style={styles.grid}>
              <Tile label="Manage Users" hint="Roles and access" icon="account-group-outline" tint="purple" onPress={onOpenAdmin} />
              <Tile label="Problem Reports" hint="From shake reports" icon="alert-circle-outline" tint="amber" onPress={onOpenProblemReports} />
            </View>
          </>
        ) : null}

        <Text style={styles.footer}>Repair. Reuse. Recycle. Give your devices another life.</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const Tile: React.FC<{
  label: string;
  hint: string;
  icon: string;
  tint: keyof typeof COLORS.tint;
  onPress: () => void;
  primary?: boolean;
}> = ({ label, hint, icon, tint, onPress, primary }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    style={({ pressed }) => [styles.tile, primary && styles.tilePrimary, pressed && styles.pressed]}
  >
    <View style={[styles.tileIcon, primary ? styles.tileIconOnPrimary : tintStyles[tint]]}>
      <AppIcon name={icon} size={24} color={primary ? '#FFFFFF' : COLORS.tintIcon[tint]} />
    </View>
    <Text style={[styles.tileLabel, primary && styles.tileLabelPrimary]}>{label}</Text>
    <Text style={[styles.tileHint, primary && styles.tileHintPrimary]} numberOfLines={1}>
      {hint}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: SPACING.xxl },
  hero: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: 56,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  brand: { color: '#FFFFFF', fontSize: FONT.heading, fontWeight: '800', letterSpacing: 0.5 },
  heroActions: { flexDirection: 'row', alignItems: 'center' },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.round,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF5252',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.round,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.primary, fontWeight: '800', fontSize: 15 },
  greetingSmall: { color: 'rgba(255,255,255,0.8)', fontSize: FONT.body },
  greeting: { color: '#FFFFFF', fontSize: FONT.title, fontWeight: '800', marginTop: 2 },
  roleChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginTop: SPACING.sm,
  },
  roleChipText: { color: '#FFFFFF', fontSize: FONT.small, fontWeight: '600' },
  ecoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.lg,
    marginTop: -40,
    padding: SPACING.lg,
    ...SHADOW.raised,
  },
  ecoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ecoLabel: { color: COLORS.textMuted, fontSize: FONT.small, fontWeight: '600' },
  ecoPoints: { color: COLORS.text, fontSize: 32, fontWeight: '800' },
  ecoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  ecoBadgeText: { color: COLORS.primaryDark, fontWeight: '700', fontSize: FONT.small, marginLeft: 4 },
  progressTrack: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
    marginTop: SPACING.md,
  },
  progressFill: { backgroundColor: COLORS.primary },
  ecoHint: { color: COLORS.textMuted, fontSize: FONT.small, marginTop: SPACING.sm },
  sectionTitle: {
    fontSize: FONT.subheading,
    fontWeight: '700',
    color: COLORS.text,
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.md },
  tile: {
    width: '46%',
    marginHorizontal: '2%',
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOW.card,
  },
  tilePrimary: { backgroundColor: COLORS.primary },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  tileIconOnPrimary: { backgroundColor: 'rgba(255,255,255,0.2)' },
  tileLabel: { fontSize: FONT.body, fontWeight: '700', color: COLORS.text },
  tileLabelPrimary: { color: '#FFFFFF' },
  tileHint: { fontSize: FONT.small, color: COLORS.textMuted, marginTop: 2 },
  tileHintPrimary: { color: 'rgba(255,255,255,0.85)' },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  footer: { textAlign: 'center', color: COLORS.textMuted, fontSize: FONT.small, marginTop: SPACING.xl },
});

/** Background tint per tile icon, from the shared palette. */
const tintStyles = StyleSheet.create(
  Object.fromEntries(Object.entries(COLORS.tint).map(([key, color]) => [key, { backgroundColor: color }])) as Record<
    keyof typeof COLORS.tint,
    { backgroundColor: string }
  >
);

export default HomeScreen;
