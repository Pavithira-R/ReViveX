import React, { useEffect, useState } from 'react';
import { useAuth } from '../context';
import {
  AdminUsersScreen,
  EcoImpactScreen,
  HomeScreen,
  LoginScreen,
  ProfileScreen,
  RegisterScreen,
  ReuseRecycleScreen,
} from '../screens';

type AuthRoute = 'Login' | 'Register';

type AppRoute =
  | 'Home'
  | 'Profile'
  | 'AdminUsers'
  | 'EcoImpact'
  | 'ReuseRecycle';

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, hasRole } = useAuth();

  const [authRoute, setAuthRoute] = useState<AuthRoute>('Login');
  const [appRoute, setAppRoute] = useState<AppRoute>('Home');

  useEffect(() => {
    setAuthRoute('Login');
    setAppRoute('Home');
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return authRoute === 'Login' ? (
      <LoginScreen
        onNavigateToRegister={() => setAuthRoute('Register')}
      />
    ) : (
      <RegisterScreen
        onNavigateToLogin={() => setAuthRoute('Login')}
      />
    );
  }

  const goHome = () => setAppRoute('Home');

  if (appRoute === 'Profile') {
    return <ProfileScreen onBack={goHome} />;
  }

  if (appRoute === 'EcoImpact') {
    return <EcoImpactScreen onBack={goHome} />;
  }

  if (appRoute === 'ReuseRecycle') {
    return <ReuseRecycleScreen />;
  }

  if (appRoute === 'AdminUsers' && hasRole('ADMIN')) {
    return <AdminUsersScreen onBack={goHome} />;
  }

  return (
    <HomeScreen
      onOpenProfile={() => setAppRoute('Profile')}
      onOpenEcoImpact={() => setAppRoute('EcoImpact')}
      onOpenAdmin={() => setAppRoute('AdminUsers')}
      onOpenReuseRecycle={() => setAppRoute('ReuseRecycle')}
    />
  );
};

export default AppNavigator;
