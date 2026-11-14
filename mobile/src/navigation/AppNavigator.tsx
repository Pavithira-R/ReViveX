import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, StyleSheet, View } from 'react-native';
import { COLORS } from '../constants';
import { useAuth } from '../context';
import {
  AdminUsersScreen,
  ChatScreen,
  ConversationsScreen,
  EcoImpactScreen,
  HomeScreen,
  LoginScreen,
  NotificationsScreen,
  ProfileScreen,
  RegisterScreen,
} from '../screens';
import { Member3Navigator } from '../features/member3';
import { Conversation } from '../types';

type AuthRoute = 'Login' | 'Register';
type AppRoute =
  | 'Home'
  | 'Profile'
  | 'AdminUsers'
  | 'EcoImpact'
  | 'Notifications'
  | 'Conversations'
  | 'Chat'
  | 'Member3';

/**
 * Top-level navigator with protected screens:
 * - Signed out → only Login / Register are reachable.
 * - Signed in  → app screens; AdminUsers additionally requires the ADMIN role.
 *
 * Kept dependency-free on purpose. Swap for React Navigation once the team
 * agrees on the shared mobile project setup; the auth gating logic stays the same.
 */
export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isRestoring, hasRole } = useAuth();
  const [authRoute, setAuthRoute] = useState<AuthRoute>('Login');
  const [appRoute, setAppRoute] = useState<AppRoute>('Home');
  const [openConversation, setOpenConversation] = useState<Conversation | null>(null);

  // Always land on the right first screen after sign-in / sign-out.
  useEffect(() => {
    setAuthRoute('Login');
    setAppRoute('Home');
  }, [isAuthenticated]);

  // Android hardware back: go back to Home/Login instead of exiting the app.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isAuthenticated && appRoute === 'Chat') {
        setAppRoute('Conversations');
        return true;
      }
      if (isAuthenticated && appRoute !== 'Home') {
        setAppRoute('Home');
        return true;
      }
      if (!isAuthenticated && authRoute === 'Register') {
        setAuthRoute('Login');
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [isAuthenticated, appRoute, authRoute]);

  if (isRestoring) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return authRoute === 'Login' ? (
      <LoginScreen onNavigateToRegister={() => setAuthRoute('Register')} />
    ) : (
      <RegisterScreen onNavigateToLogin={() => setAuthRoute('Login')} />
    );
  }

  const goHome = () => setAppRoute('Home');

  if (appRoute === 'Profile') {
    return <ProfileScreen onBack={goHome} />;
  }
  if (appRoute === 'Conversations') {
    return (
      <ConversationsScreen
        onBack={goHome}
        onOpenConversation={(conversation) => {
          setOpenConversation(conversation);
          setAppRoute('Chat');
        }}
      />
    );
  }
  if (appRoute === 'Chat' && openConversation) {
    return (
      <ChatScreen
        conversation={openConversation}
        onBack={() => setAppRoute('Conversations')}
      />
    );
  }
  if (appRoute === 'Notifications') {
    return <NotificationsScreen onBack={goHome} />;
  }
  if (appRoute === 'EcoImpact') {
    return <EcoImpactScreen onBack={goHome} />;
  }
  if (appRoute === 'AdminUsers' && hasRole('ADMIN')) {
    return <AdminUsersScreen onBack={goHome} />;
  }
  if (appRoute === 'Member3') {
    return (
      <Member3Navigator
        onNavigateBack={goHome}
        onNavigateToModule4={(providerId, category) => {
          Alert.alert(
            'Handoff to Member 4 (Repair)',
            `Booking service provider: ${providerId || 'Selected Provider'} for ${category || 'Device'}`
          );
        }}
        onNavigateToModule5={(actionType, draft) => {
          Alert.alert(
            'Handoff to Member 5 (Marketplace / Donation / Recycling)',
            `Action: ${actionType}\nDraft: ${JSON.stringify(draft || {}, null, 2)}`
          );
        }}
        onNavigateToModule2={(itemDraft) => {
          Alert.alert(
            'Handoff to Member 2 (Inventory)',
            `Item saved to user inventory: ${JSON.stringify(itemDraft || {}, null, 2)}`
          );
        }}
      />
    );
  }

  return (
    <HomeScreen
      onOpenProfile={() => setAppRoute('Profile')}
      onOpenEcoImpact={() => setAppRoute('EcoImpact')}
      onOpenNotifications={() => setAppRoute('Notifications')}
      onOpenMessages={() => setAppRoute('Conversations')}
      onOpenAdmin={() => setAppRoute('AdminUsers')}
      onOpenDiscovery={() => setAppRoute('Member3')}
    />
  );
};

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
});
