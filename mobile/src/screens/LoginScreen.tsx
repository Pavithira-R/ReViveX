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
import { APP_NAME, APP_TAGLINE, COLORS } from '../constants';
import { useAuth } from '../context';
import { getErrorMessage, isValidEmail } from '../utils';

interface LoginScreenProps {
  onNavigateToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateToRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    setErrorMessage(null);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.logo}>{APP_NAME}</Text>
            <Text style={styles.tagline}>{APP_TAGLINE}</Text>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue giving devices another life.</Text>
          </View>

          <MessageBanner message={errorMessage} />

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

          <PrimaryButton title="Sign In" onPress={handleLogin} loading={isLoading} />

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
  logo: { fontSize: 32, fontWeight: '800', color: COLORS.primary, textAlign: 'center' },
  tagline: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginBottom: 28 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 15, color: COLORS.textMuted, marginTop: 4 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: COLORS.textMuted, fontSize: 15 },
  footerLink: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },
});

export default LoginScreen;
