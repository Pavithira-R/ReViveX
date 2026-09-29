import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { ServiceProvider } from '../types';
import { mobileProviderService } from '../providerService';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../../theme';
import { Header } from '../../../components/common/Header';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { ErrorState } from '../../../components/common/ErrorState';

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
    return <LoadingSpinner message="Loading provider profile..." />;
  }

  if (error || !provider) {
    return (
      <View style={styles.container}>
        <Header title="Provider Profile" showBack onBack={onNavigateBack} />
        <ErrorState
          title={!provider ? 'Provider Not Found' : 'Failed to Load Profile'}
          message={error || 'The requested service provider does not exist or has been removed.'}
          onRetry={loadProvider}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={provider.businessName}
        subtitle="Certified Repair Provider"
        showBack={Boolean(onNavigateBack)}
        onBack={onNavigateBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Hero Banner / Avatar */}
        <View style={styles.heroCard}>
          <View style={styles.avatarRow}>
            {provider.profileImage ? (
              <Image source={{ uri: provider.profileImage }} style={styles.heroAvatar} />
            ) : (
              <View style={styles.heroAvatarFallback}>
                <Text style={styles.heroInitials}>
                  {provider.businessName.substring(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.heroDetails}>
              <View style={styles.badgeRow}>
                {provider.isVerified ? (
                  <Badge label="Verified Partner" variant="success" size="sm" />
                ) : (
                  <Badge label="Community Tech" variant="neutral" size="sm" />
                )}
                <Badge label="Eco-Certified" variant="primary" size="sm" />
              </View>
              <Text style={styles.heroBusinessName}>{provider.businessName}</Text>
              <Text style={styles.heroTechName}>Technician: {provider.name}</Text>
            </View>
          </View>

          {/* Quick Metrics */}
          <View style={styles.metricsContainer}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Rating</Text>
              <View style={styles.ratingValueRow}>
                <Text style={styles.metricStar}>★</Text>
                <Text style={styles.metricValue}>{provider.rating.toFixed(1)}</Text>
              </View>
              <Text style={styles.metricSub}>{provider.reviewCount} reviews</Text>
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
              <Text style={[styles.metricValue, { color: Colors.primary }]}>
                ${provider.startingPrice ?? 30}
              </Text>
              <Text style={styles.metricSub}>Diagnostics</Text>
            </View>
          </View>
        </View>

        {/* About / Bio Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>About the Provider</Text>
          <Text style={styles.sectionBody}>
            {provider.description || 'No detailed description available.'}
          </Text>
        </View>

        {/* Services Offered Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Services Offered</Text>
          {provider.servicesOffered.length > 0 ? (
            <View style={styles.servicesGrid}>
              {provider.servicesOffered.map((service, index) => (
                <View key={index} style={styles.serviceItem}>
                  <Text style={styles.serviceCheck}>✓</Text>
                  <Text style={styles.serviceText}>{service}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No specific service list provided.</Text>
          )}
        </View>

        {/* Availability & Location Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Availability & Location</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🕒</Text>
            <View style={styles.infoTextGroup}>
              <Text style={styles.infoLabel}>Working Hours</Text>
              <Text style={styles.infoValue}>{provider.availability}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <View style={styles.infoTextGroup}>
              <Text style={styles.infoLabel}>Workshop Location</Text>
              <Text style={styles.infoValue}>{provider.location}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            title="Request Repair Quotation"
            onPress={() => onRequestRepair?.(provider)}
            variant="primary"
            size="lg"
            style={styles.primaryActionButton}
          />
          <Button
            title="Book Appointment"
            onPress={() => onBookDirectly?.(provider)}
            variant="outline"
            size="md"
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  heroAvatar: {
    width: 68,
    height: 68,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceSubtle,
    marginRight: Spacing.md,
  },
  heroAvatarFallback: {
    width: 68,
    height: 68,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  heroInitials: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.primaryDark,
  },
  heroDetails: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  heroBusinessName: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
  },
  heroTechName: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  metricsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  metricBox: {
    alignItems: 'center',
    flex: 1,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  ratingValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricStar: {
    color: Colors.accent,
    fontSize: Typography.fontSizes.xs,
    marginRight: 2,
  },
  metricValue: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
  },
  metricSub: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  sectionBody: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  servicesGrid: {
    gap: Spacing.xs + 2,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  serviceCheck: {
    color: Colors.primary,
    fontWeight: Typography.fontWeights.bold,
    marginRight: Spacing.sm,
  },
  serviceText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textPrimary,
  },
  emptyText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textMuted,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  infoIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  infoTextGroup: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  infoValue: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeights.medium,
    marginTop: 1,
  },
  actionsContainer: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  primaryActionButton: {
    backgroundColor: Colors.primary,
  },
});
