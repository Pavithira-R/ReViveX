import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, FormInput, MessageBanner, PrimaryButton } from '../../../../components';
import { COLORS, FONT, RADIUS, SPACING } from '../../../../constants';
import { repairService } from '../../repair.service';
import { ServiceProvider } from '../../types';

interface EditProviderProfileScreenProps {
  onBack: () => void;
  onProfileSaved?: (provider: ServiceProvider) => void;
}

const CITY_OPTIONS = [
  'Colombo',
  'Kandy',
  'Galle',
  'Jaffna',
  'Gampaha',
  'Negombo',
  'Kurunegala',
  'Matara',
];

const CATEGORY_OPTIONS = [
  'Laptops',
  'Smartphones',
  'Tablets',
  'Audio',
  'Consoles',
  'Monitors',
  'Other',
];

const SERVICE_OPTIONS = [
  'Screen Replacement',
  'Battery Replacement',
  'Water Damage Repair',
  'Logic Board Soldering',
  'Data Recovery',
  'OS / Software Troubleshooting',
  'Component Cleaning & Dusting',
];

export const EditProviderProfileScreen: React.FC<EditProviderProfileScreenProps> = ({
  onBack,
  onProfileSaved,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCity, setSelectedCity] = useState('Colombo');
  const [startingPrice, setStartingPrice] = useState('2500');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Laptops', 'Smartphones']);
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'Screen Replacement',
    'Battery Replacement',
  ]);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const existing = await repairService.getMyProviderProfile();
      if (existing) {
        setBusinessName(existing.businessName || existing.name || '');
        setDescription(existing.description || '');
        setPhone(existing.phone || existing.phoneNumber || '');
        if (existing.location?.city) {
          setSelectedCity(existing.location.city);
        }
        if (existing.startingPrice) {
          setStartingPrice(String(existing.startingPrice));
        }
        if (existing.categoryIds && existing.categoryIds.length > 0) {
          setSelectedCategories(existing.categoryIds);
        }
        const s = existing.services || existing.servicesOffered;
        if (s && s.length > 0) {
          setSelectedServices(s);
        }
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Could not load existing profile.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleService = (srv: string) => {
    setSelectedServices((prev) =>
      prev.includes(srv) ? prev.filter((s) => s !== srv) : [...prev, srv]
    );
  };

  const handleSave = async () => {
    setMessage(null);
    if (!businessName.trim()) {
      setMessage({ text: 'Business name is required.', type: 'error' });
      return;
    }
    if (!phone.trim()) {
      setMessage({ text: 'Contact phone number is required.', type: 'error' });
      return;
    }
    if (selectedCategories.length === 0) {
      setMessage({ text: 'Please select at least one device category.', type: 'error' });
      return;
    }
    if (selectedServices.length === 0) {
      setMessage({ text: 'Please select at least one repair service.', type: 'error' });
      return;
    }

    const priceNum = Number(startingPrice.replace(/[^0-9]/g, '')) || 2000;

    setIsSaving(true);
    try {
      const saved = await repairService.saveMyProviderProfile({
        businessName: businessName.trim(),
        description: description.trim(),
        phone: phone.trim(),
        startingPrice: priceNum,
        categoryIds: selectedCategories,
        services: selectedServices,
        servicesOffered: selectedServices,
        location: {
          city: selectedCity,
          latitude: 6.9271,
          longitude: 79.8612,
        },
      });

      setMessage({ text: 'Technician business profile saved successfully!', type: 'success' });
      if (onProfileSaved) {
        onProfileSaved(saved);
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to save profile.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} accessibilityRole="button" hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.topTitle}>Technician Profile</Text>
        <View style={styles.topSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {message ? (
            <MessageBanner
              message={message.text}
              type={message.type}
            />
          ) : null}

          {isLoading ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loaderText}>Loading your technician profile...</Text>
            </View>
          ) : (
            <>
              {/* Basic Business Info */}
              <Card style={styles.sectionCard}>
                <Text style={styles.sectionHeading}>Business Information</Text>
                <Text style={styles.sectionSub}>
                  This info appears on your public technician card in the repair directory.
                </Text>

                <FormInput
                  label="Business / Shop Name *"
                  value={businessName}
                  onChangeText={setBusinessName}
                  placeholder="e.g. TechFix Repairs Colombo"
                />

                <FormInput
                  label="Contact Phone Number *"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="e.g. 077 123 4567"
                  keyboardType="phone-pad"
                />

                <FormInput
                  label="Business Bio & Specializations"
                  value={description}
                  onChangeText={setDescription}
                  placeholder="e.g. 8+ years experience in chip-level logic board repairs and screen replacements."
                  multiline
                  numberOfLines={3}
                />
              </Card>

              {/* Operating City */}
              <Card style={styles.sectionCard}>
                <Text style={styles.sectionHeading}>Service Location (City)</Text>
                <Text style={styles.sectionSub}>Select the primary city or hub you operate in.</Text>
                <View style={styles.chipGrid}>
                  {CITY_OPTIONS.map((city) => {
                    const active = selectedCity === city;
                    return (
                      <Pressable
                        key={city}
                        onPress={() => setSelectedCity(city)}
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {city}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Card>

              {/* Starting Price in LKR */}
              <Card style={styles.sectionCard}>
                <Text style={styles.sectionHeading}>Starting Diagnostic & Service Rate</Text>
                <Text style={styles.sectionSub}>
                  Base inspection / starting price displayed to customers in Sri Lankan Rupees (Rs.).
                </Text>
                <FormInput
                  label="Starting Price (Rs.) *"
                  value={startingPrice}
                  onChangeText={setStartingPrice}
                  placeholder="2500"
                  keyboardType="numeric"
                />
              </Card>

              {/* Categories */}
              <Card style={styles.sectionCard}>
                <Text style={styles.sectionHeading}>Device Categories Repaired</Text>
                <Text style={styles.sectionSub}>Tap to select all devices you service.</Text>
                <View style={styles.chipGrid}>
                  {CATEGORY_OPTIONS.map((cat) => {
                    const active = selectedCategories.includes(cat);
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => toggleCategory(cat)}
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {active ? `✓ ${cat}` : cat}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Card>

              {/* Services Offered */}
              <Card style={styles.sectionCard}>
                <Text style={styles.sectionHeading}>Specific Services Provided</Text>
                <Text style={styles.sectionSub}>Services you offer for quotation requests.</Text>
                <View style={styles.chipGrid}>
                  {SERVICE_OPTIONS.map((srv) => {
                    const active = selectedServices.includes(srv);
                    return (
                      <Pressable
                        key={srv}
                        onPress={() => toggleService(srv)}
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {active ? `✓ ${srv}` : srv}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Card>

              <View style={styles.buttonRow}>
                <PrimaryButton
                  title="Save Business Profile"
                  onPress={handleSave}
                  loading={isSaving}
                />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  back: {
    fontSize: FONT.md,
    color: COLORS.primary,
    fontWeight: '700',
  },
  topTitle: {
    fontSize: FONT.md + 1,
    fontWeight: '700',
    color: COLORS.text,
  },
  topSpacer: {
    width: 48,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },
  loaderBox: {
    paddingVertical: SPACING.xl * 2,
    alignItems: 'center',
  },
  loaderText: {
    marginTop: SPACING.sm,
    fontSize: FONT.sm,
    color: COLORS.textMuted,
  },
  sectionCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  sectionHeading: {
    fontSize: FONT.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: FONT.xs + 1,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs + 2,
  },
  chip: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONT.xs + 1,
    color: COLORS.text,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  buttonRow: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
});
