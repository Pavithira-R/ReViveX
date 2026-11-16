import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ServiceProvider } from '../types';
import { mobileProviderService } from '../providerService';
import { chatService } from '../../../../services';
import { Card, MessageBanner, PrimaryButton, StatusBadge } from '../../../../components';
import { COLORS, FONT, RADIUS, SHADOW, SPACING } from '../../../../constants';

interface ProviderProfileScreenProps {
  providerId?: string;
  onNavigateBack?: () => void;
  onRequestRepair?: (provider: ServiceProvider) => void;
  onBookDirectly?: (provider: ServiceProvider) => void;
}

export const ProviderProfileScreen: React.FC<ProviderProfileScreenProps> = ({
  providerId = 'prov_fixit_001',
  onNavigateBack,
  onRequestRepair,
  onBookDirectly,
}) => {
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadProvider = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await mobileProviderService.fetchProviderById(providerId);
      if (response.success && response.data) {
        setProvider(response.data);
      } else {
        setError(response.error || 'Provider not found');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load service provider details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProvider();
  }, [providerId]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (error || !provider) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <Pressable onPress={onNavigateBack} accessibilityRole="button" hitSlop={12}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
          <Text style={styles.topTitle}>Provider Profile</Text>
          <View style={styles.topSpacer} />
        </View>
        <View style={styles.errorBox}>
          <MessageBanner message={error || 'Provider not found'} />
          <PrimaryButton title="Try again" variant="outlined" onPress={loadProvider} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={onNavigateBack} accessibilityRole="button" hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          {provider.businessName}
        </Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Hero Banner / Avatar */}
        <Card style={styles.heroCard}>
          <View style={styles.avatarRow}>
            {provider.profileImage ? (
              <Image source={{ uri: provider.profileImage }} style={styles.heroAvatar} />
            ) : (
              <View style={styles.heroAvatarFallback}>
                <Text style={styles.heroInitials}>
                  {(provider.businessName || 'SP').substring(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.heroDetails}>
              <View style={styles.badgeRow}>
                {provider.isVerified && <StatusBadge status="VERIFIED" />}
                <StatusBadge status="CERTIFIED" />
              </View>
              <Text style={styles.heroBusinessName}>{provider.businessName}</Text>
              <Text style={styles.heroTechName}>Technician: {provider.name || provider.businessName}</Text>
            </View>
          </View>

          {/* Quick Metrics */}
          <View style={styles.metricsContainer}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Rating</Text>
              <View style={styles.ratingValueRow}>
                <Text style={styles.metricStar}>★</Text>
                <Text style={styles.metricValue}>
                  {(provider.ratingAverage ?? provider.rating ?? 5.0).toFixed(1)}
                </Text>
              </View>
              <Text style={styles.metricSub}>{provider.ratingCount ?? provider.reviewCount ?? 0} reviews</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Distance</Text>
              <Text style={styles.metricValue}>{provider.distanceKm ?? 2.4} km</Text>
              <Text style={styles.metricSub}>Nearby Hub</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Est. Starting</Text>
              <Text style={[styles.metricValue, { color: COLORS.primary }]}>
                ${provider.startingPrice ?? 30}
              </Text>
              <Text style={styles.metricSub}>Diagnostics</Text>
            </View>
          </View>
        </Card>

        {/* About / Bio Section */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>About the Provider</Text>
          <Text style={styles.sectionBody}>
            {provider.description || 'No detailed description available.'}
          </Text>
        </Card>

        {/* Services Offered Section */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Services Offered</Text>
          {(provider.servicesOffered || provider.services || []).length > 0 ? (
            <View style={styles.servicesGrid}>
              {(provider.servicesOffered || provider.services || []).map((service, index) => (
                <View key={index} style={styles.serviceItem}>
                  <Text style={styles.serviceCheck}>✓</Text>
                  <Text style={styles.serviceText}>{service}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No specific service list provided.</Text>
          )}
        </Card>

        {/* Availability & Location Section */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Availability & Location</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🕒</Text>
            <View style={styles.infoTextGroup}>
              <Text style={styles.infoLabel}>Working Hours</Text>
              <Text style={styles.infoValue}>
                {provider.availability || 'Mon - Sat: 9:00 AM - 6:00 PM'}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <View style={styles.infoTextGroup}>
              <Text style={styles.infoLabel}>Workshop Location</Text>
              <Text style={styles.infoValue}>
                {typeof provider.location === 'object' ? provider.location?.city : (provider.location || 'Colombo, Sri Lanka')}
              </Text>
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <PrimaryButton
            title="Request Repair Quotation"
            onPress={() => onRequestRepair?.(provider)}
          />
          <View style={{ height: SPACING.sm }} />
          <PrimaryButton
            title="Chat with Provider 💬"
            variant="outlined"
            onPress={async () => {
              try {
                await chatService.startWithUser(provider.id || provider.userId);
              } catch (e) {
                console.log('Chat error:', e);
              }
            }}
          />
          <View style={{ height: SPACING.sm }} />
          <PrimaryButton
            title="Book Appointment"
            variant="outlined"
            onPress={() => onBookDirectly?.(provider)}
          />
        </View>
      </ScrollView>
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
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  loader: {
    marginTop: 40,
  },
  errorBox: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  heroCard: {
    marginBottom: SPACING.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  heroAvatar: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSubtle,
    marginRight: SPACING.md,
  },
  heroAvatarFallback: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  heroInitials: {
    fontSize: FONT.lg,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  heroDetails: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: 4,
  },
  heroBusinessName: {
    fontSize: FONT.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  heroTechName: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  metricsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  ratingValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  metricStar: {
    color: COLORS.accent,
    fontSize: 12,
  },
  metricValue: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: COLORS.text,
  },
  metricSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    height: '80%',
    alignSelf: 'center',
  },
  sectionCard: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  sectionBody: {
    fontSize: FONT.sm,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  servicesGrid: {
    gap: SPACING.xs,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  serviceCheck: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  serviceText: {
    fontSize: FONT.sm,
    color: COLORS.text,
  },
  emptyText: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  infoIcon: {
    fontSize: 18,
  },
  infoTextGroup: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  infoValue: {
    fontSize: FONT.sm,
    color: COLORS.text,
    fontWeight: '500',
    marginTop: 1,
  },
  actionsContainer: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },
});
