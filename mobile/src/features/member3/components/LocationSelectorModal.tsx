// ============================================================================
// Member 3 - LocationSelectorModal Component
// Modal enabling users to trigger live GPS, use profile address, or pick a city
// ============================================================================

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { UserLocationState, CityPreset, LocationCoordinates } from '../types';
import { SRI_LANKA_CITY_PRESETS } from '../utils/location';
import {
  resolveUserLocation,
  setManualCity,
} from '../services/locationService';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

interface LocationSelectorModalProps {
  visible: boolean;
  currentLocation: UserLocationState;
  profileCoordinates?: LocationCoordinates | null;
  profileCity?: string | null;
  onLocationChanged: (newLocation: UserLocationState) => void;
  onClose: () => void;
}

export const LocationSelectorModal: React.FC<LocationSelectorModalProps> = ({
  visible,
  currentLocation,
  profileCoordinates,
  profileCity,
  onLocationChanged,
  onClose,
}) => {
  const [loadingGps, setLoadingGps] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRequestGps = async () => {
    setLoadingGps(true);
    setErrorMessage(null);

    try {
      const updated = await resolveUserLocation({
        coordinates: profileCoordinates,
        cityName: profileCity,
      });

      if (updated.source === 'GPS') {
        onLocationChanged(updated);
        onClose();
      } else {
        // Fallback occurred (permission denied or GPS timeout)
        setErrorMessage(
          updated.error ||
            'Could not acquire live GPS signal. You can select your city manually below.'
        );
        onLocationChanged(updated);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'GPS request failed. Please choose your city.');
    } finally {
      setLoadingGps(false);
    }
  };

  const handleSelectProfileAddress = () => {
    if (!profileCoordinates) return;
    setErrorMessage(null);
    const updated: UserLocationState = {
      coordinates: profileCoordinates,
      source: 'PROFILE',
      cityName: profileCity || 'Profile Location',
      district: undefined,
      permissionStatus: currentLocation.permissionStatus,
      isLiveGps: false,
      error: null,
    };
    onLocationChanged(updated);
    onClose();
  };

  const handleSelectCity = (city: CityPreset) => {
    setErrorMessage(null);
    const updated = setManualCity(city);
    onLocationChanged(updated);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Select Location</Text>
              <Text style={styles.subtitle}>
                Nearby providers and e-waste drop-offs are sorted by proximity.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Action 1: Live Device GPS */}
            <TouchableOpacity
              style={[
                styles.actionCard,
                currentLocation.source === 'GPS' && styles.actionCardActive,
              ]}
              onPress={handleRequestGps}
              disabled={loadingGps}
            >
              <View style={styles.actionIconContainer}>
                {loadingGps ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Text style={styles.actionIcon}>🎯</Text>
                )}
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Use My Live GPS Location</Text>
                <Text style={styles.actionDesc}>
                  Requests device location on-demand for accurate distance calculations
                </Text>
              </View>
              {currentLocation.source === 'GPS' && (
                <Text style={styles.activeCheck}>✓</Text>
              )}
            </TouchableOpacity>

            {/* Action 2: Profile Location (if available from Member 1) */}
            {profileCoordinates && (
              <TouchableOpacity
                style={[
                  styles.actionCard,
                  currentLocation.source === 'PROFILE' && styles.actionCardActive,
                ]}
                onPress={handleSelectProfileAddress}
              >
                <View style={styles.actionIconContainer}>
                  <Text style={styles.actionIcon}>👤</Text>
                </View>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>
                    Use Saved Profile Location ({profileCity || 'Home'})
                  </Text>
                  <Text style={styles.actionDesc}>
                    Uses coordinates saved in your ReViveX account
                  </Text>
                </View>
                {currentLocation.source === 'PROFILE' && (
                  <Text style={styles.activeCheck}>✓</Text>
                )}
              </TouchableOpacity>
            )}

            {/* Section Divider */}
            <View style={styles.sectionDividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>Or Select Sri Lankan City / District</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* City Preset List */}
            {SRI_LANKA_CITY_PRESETS.map((city) => {
              const isSelected =
                currentLocation.source === 'MANUAL' &&
                currentLocation.cityName === city.name;

              return (
                <TouchableOpacity
                  key={city.id}
                  style={[
                    styles.cityRow,
                    isSelected && styles.cityRowActive,
                  ]}
                  onPress={() => handleSelectCity(city)}
                >
                  <View>
                    <Text style={[styles.cityName, isSelected && styles.cityNameActive]}>
                      {city.name}
                    </Text>
                    <Text style={styles.cityDistrict}>
                      {city.district} District • {city.province} Province
                    </Text>
                  </View>
                  {isSelected && <Text style={styles.activeCheck}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '85%',
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
    ...SHADOWS.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    maxWidth: 270,
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  closeIcon: {
    fontSize: 18,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    lineHeight: 16,
  },
  scrollArea: {
    marginTop: SPACING.xs,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  actionCardActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  actionDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  activeCheck: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  sectionDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginHorizontal: SPACING.sm,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cityRowActive: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.sm,
    borderBottomColor: 'transparent',
  },
  cityName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cityNameActive: {
    color: COLORS.primary,
  },
  cityDistrict: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
});
