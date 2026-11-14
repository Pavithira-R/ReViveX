import React, { useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
import { useAuth } from '../context';
import {
  AdminUsersScreen,
  HomeScreen,
  LoginScreen,
  ProfileScreen,
  RegisterScreen,
} from '../screens';

type AuthRoute = 'Login' | 'Register';
type AppRoute = 'Home' | 'Profile' | 'AdminUsers';

/**
 * Top-level navigator with protected screens:
 * - Signed out → only Login / Register are reachable.
 * - Signed in  → app screens; AdminUsers additionally requires the ADMIN role.
 *
 * Kept dependency-free on purpose. Swap for React Navigation once the team
 * agrees on the shared mobile project setup; the auth gating logic stays the same.
 */
export const AppNavigator: React.FC = () => {
  const { isAuthenticated, hasRole } = useAuth();
  const [authRoute, setAuthRoute] = useState<AuthRoute>('Login');
  const [appRoute, setAppRoute] = useState<AppRoute>('Home');

  // Always land on the right first screen after sign-in / sign-out.
  useEffect(() => {
    setAuthRoute('Login');
    setAppRoute('Home');
  }, [isAuthenticated]);

  // Android hardware back: go back to Home/Login instead of exiting the app.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
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
  if (appRoute === 'AdminUsers' && hasRole('ADMIN')) {
    return <AdminUsersScreen onBack={goHome} />;
  }

  return (
    <HomeScreen
      onOpenProfile={() => setAppRoute('Profile')}
      onOpenAdmin={() => setAppRoute('AdminUsers')}
    />
  );
};
