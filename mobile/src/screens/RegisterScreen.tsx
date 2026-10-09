import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormInput, MessageBanner, PrimaryButton } from '../components';
import { APP_NAME, COLORS, ROLE_LABELS } from '../constants';
import { useAuth } from '../context';
import { PUBLIC_ROLES, UserRole } from '../types';
import { getErrorMessage, isValidEmail, isValidPassword } from '../utils';

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
}

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  ITEM_OWNER: 'I have devices to repair, sell, donate or recycle',
  SERVICE_PROVIDER: 'I repair electronic devices',
  BUYER: 'I want to buy or reuse devices and parts',
  RECYCLER: 'I collect and recycle e-waste',
  ADMIN: '',
};

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onNavigateToLogin }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('ITEM_OWNER');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!name.trim()) return 'Please enter your full name.';
    if (!isValidEmail(email)) return 'Please enter a valid email address.';
    if (!isValidPassword(password)) {
      return 'Password must be at least 8 characters and include letters and numbers.';
    }
    if (password !== confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleRegister = async () => {
    const validationError = validate();
    setErrorMessage(validationError);
    if (validationError) return;

    setIsLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        phone: phone.trim() || undefined,
      });
      // Registration signs the user in; AppNavigator switches screens.
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Registration failed. Please try again.'));
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.logo}>{APP_NAME}</Text>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Fields marked * are required.</Text>

          <MessageBanner message={errorMessage} />

          <FormInput
            label="Full name"
            required
            placeholder="e.g. Nimal Perera"
            value={name}
            onChangeText={setName}
            autoComplete="name"
          />
          <FormInput
            label="Email address"
            required
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            autoCorrect={false}
          />
          <FormInput
            label="Phone number"
            placeholder="+94 77 123 4567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
          />
          <FormInput
            label="Password"
            required
            placeholder="At least 8 characters, letters and numbers"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
          />
          <FormInput
            label="Confirm password"
            required
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoComplete="new-password"
          />

          <Text style={styles.sectionLabel}>How will you use ReViveX? *</Text>
          {PUBLIC_ROLES.map((option) => {
            const selected = role === option;
            return (
              <Pressable
                key={option}
                onPress={() => setRole(option)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[styles.roleOption, selected && styles.roleOptionSelected]}
              >
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected ? <View style={styles.radioDot} /> : null}
                </View>
                <View style={styles.flex}>
                  <Text style={styles.roleTitle}>{ROLE_LABELS[option]}</Text>
                  <Text style={styles.roleDescription}>{ROLE_DESCRIPTIONS[option]}</Text>
                </View>
              </Pressable>
            );
          })}

          <PrimaryButton title="Create Account" onPress={handleRegister} loading={isLoading} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Pressable onPress={onNavigateToLogin} accessibilityRole="link" hitSlop={8}>
              <Text style={styles.footerLink}>Sign In</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, padding: 24 },
  logo: { fontSize: 24, fontWeight: '800', color: COLORS.primary, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 4, marginBottom: 16 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 4 },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    minHeight: 56,
  },
  roleOptionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioSelected: { borderColor: COLORS.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  roleTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  roleDescription: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, marginBottom: 12 },
  footerText: { color: COLORS.textMuted, fontSize: 15 },
  footerLink: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },
});

export default RegisterScreen;
