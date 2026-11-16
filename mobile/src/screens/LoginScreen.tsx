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
import { AppIcon, FormInput, MessageBanner, PrimaryButton } from '../components';
import { APP_NAME, APP_TAGLINE, COLORS } from '../constants';
import { useAuth } from '../context';
import { authService, useCapability } from '../services';
import { getErrorMessage, isValidEmail } from '../utils';

interface LoginScreenProps {
  onNavigateToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateToRegister }) => {
  const { login, loginWithBiometrics, isBiometricEnabled } = useAuth();
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { status: biometricStatus } = useCapability('biometric');
  const canUseFingerprint = isBiometricEnabled && biometricStatus === 'available';
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isValidEmail(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email: email.trim(), password });
      // AppNavigator switches to the signed-in area automatically.
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Login failed. Please check your credentials.'));
      setIsLoading(false);
    }
  };

  /** Emails a reset link to the address typed in the Email field. */
  const handleForgotPassword = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!isValidEmail(email)) {
      setErrorMessage('Enter your email address above, then tap "Forgot password?" again.');
      return;
    }
    setIsSendingReset(true);
    try {
      await authService.sendPasswordReset(email);
      setSuccessMessage(
        `If ${email.trim()} has a ReViveX account, a link to reset your password has been sent. Check your inbox and spam folder.`
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Could not send the reset email.'));
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleBiometricLogin = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsBiometricLoading(true);
    try {
      const signedIn = await loginWithBiometrics();
      if (!signedIn) {
        setErrorMessage('Fingerprint not confirmed. Sign in with your password instead.');
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Fingerprint login failed. Sign in with your password.'));
    } finally {
      setIsBiometricLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoMark}>
              <AppIcon name="leaf" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.logo}>{APP_NAME}</Text>
            <Text style={styles.tagline}>{APP_TAGLINE}</Text>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue giving devices another life.</Text>
          </View>

          <MessageBanner message={errorMessage} />
          <MessageBanner message={successMessage} type="success" />

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
            returnKeyType="next"
          />
          <FormInput
            label="Password"
            required
            placeholder="Your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            returnKeyType="go"
            onSubmitEditing={handleLogin}
          />
          <Pressable
            onPress={handleForgotPassword}
            disabled={isSendingReset}
            accessibilityRole="button"
            hitSlop={8}
            style={styles.forgot}
          >
            <Text style={styles.forgotText}>{isSendingReset ? 'Sending…' : 'Forgot password?'}</Text>
          </Pressable>

          <PrimaryButton title="Sign In" onPress={handleLogin} loading={isLoading} />
          {canUseFingerprint ? (
            <PrimaryButton
              title="Log in with fingerprint"
              variant="outlined"
              onPress={handleBiometricLogin}
              loading={isBiometricLoading}
              disabled={isLoading}
            />
          ) : null}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Pressable onPress={onNavigateToRegister} accessibilityRole="link" hitSlop={8}>
              <Text style={styles.footerLink}>Register</Text>
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
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { marginBottom: 24 },
  logoMark: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 6,
    shadowColor: '#0B2A14',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  logo: { fontSize: 32, fontWeight: '800', color: COLORS.primary, textAlign: 'center', letterSpacing: 0.5 },
  tagline: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginBottom: 28 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 15, color: COLORS.textMuted, marginTop: 4 },
  forgot: { alignSelf: 'flex-end', marginTop: -6, marginBottom: 14 },
  forgotText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: COLORS.textMuted, fontSize: 15 },
  footerLink: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },
});

export default LoginScreen;
