import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, StyleSheet, View } from 'react-native';
import { TabBar, TabKey } from '../components';
import { COLORS } from '../constants';
import { useAuth, useProblemReport } from '../context';
import {
  AdminUsersScreen,
  BrowseItemsScreen,
  ChatScreen,
  ConversationsScreen,
  EcoImpactScreen,
  HomeScreen,
  ItemDetailsScreen,
  LoginScreen,
  MyItemsScreen,
  NotificationsScreen,
  PostItemScreen,
  ProblemReportsScreen,
  ProfileScreen,
  RegisterScreen,
  ReviewsScreen,
  ReuseRecycleScreen,
  WriteReviewScreen,
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
  | 'Member3'
  | 'PostItem'
  | 'MyItems'
  | 'BrowseItems'
  | 'ItemDetails'
  | 'ProblemReports'
  | 'Reviews'
  | 'ReuseRecycle'
  | 'WriteReview';

/**
 * Top-level navigator with protected screens:
 * - Signed out â†’ only Login / Register are reachable.
 * - Signed in  â†’ app screens; AdminUsers additionally requires the ADMIN role.
 *
 * Kept dependency-free on purpose. Swap for React Navigation once the team
 * agrees on the shared mobile project setup; the auth gating logic stays the same.
 */
export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isRestoring, hasRole, user } = useAuth();
  const { setCurrentScreen } = useProblemReport();
  const [authRoute, setAuthRoute] = useState<AuthRoute>('Login');
  const [appRoute, setAppRoute] = useState<AppRoute>('Home');
  const [openConversation, setOpenConversation] = useState<Conversation | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  // Member 6 â€“ whose reviews to show, and where Back returns to.
  const [reviewsOf, setReviewsOf] = useState<{ userId: string; userName?: string } | null>(null);
  const [routeBeforeReviews, setRouteBeforeReviews] = useState<AppRoute>('Home');
  const [reviewTarget, setReviewTarget] = useState<any>(null);
  const [routeBeforeWriteReview, setRouteBeforeWriteReview] = useState<AppRoute>('ReuseRecycle');
  const [reuseRecycleInitialTab, setReuseRecycleInitialTab] = useState<'BROWSE' | 'CREATE' | 'OFFERS' | 'RECYCLE' | 'TRANSACTIONS' | undefined>(undefined);
  const [reuseRecycleInitialAction, setReuseRecycleInitialAction] = useState<'SELL' | 'DONATE' | 'REUSE' | 'RECYCLE' | undefined>(undefined);
  const [postItemInitialDraft, setPostItemInitialDraft] = useState<any>(undefined);

  // Always land on the right first screen after sign-in / sign-out.
  useEffect(() => {
    setAuthRoute('Login');
    setAppRoute('Home');
  }, [isAuthenticated]);

  // Reports sent by shaking the phone include the screen the user is on.
  useEffect(() => {
    setCurrentScreen(isAuthenticated ? appRoute : authRoute);
  }, [isAuthenticated, appRoute, authRoute, setCurrentScreen]);

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

  /** Member 6 – the four main sections get the bottom tab bar. */
  const TAB_ROUTES: Record<TabKey, AppRoute> = {
    home: 'Home',
    discover: 'Member3',
    messages: 'Conversations',
    profile: 'Profile',
  };
  const withTabs = (tab: TabKey, screen: React.ReactNode) => (
    <View style={styles.tabScreen}>
      <View style={styles.tabScreen}>{screen}</View>
      <TabBar active={tab} onSelect={(next) => setAppRoute(TAB_ROUTES[next])} />
    </View>
  );
  const openItem = (id: string) => {
    setSelectedItemId(id);
    setAppRoute('ItemDetails');
  };
  /** Member 6 â€“ reviews a user has received (own profile, or e.g. a service provider). */
  const openReviews = (userId: string, userName?: string) => {
    setRouteBeforeReviews(appRoute);
    setReviewsOf({ userId, userName });
    setAppRoute('Reviews');
  };

  if (appRoute === 'Profile') {
    return withTabs(
      'profile',
      <ProfileScreen onBack={goHome} onOpenReviews={() => user && openReviews(user.id)} />
    );
  }
  if (appRoute === 'WriteReview' && reviewTarget) {
    return (
      <WriteReviewScreen
        target={reviewTarget}
        onBack={() => setAppRoute(routeBeforeWriteReview)}
      />
    );
  }

  if (appRoute === 'ReuseRecycle') {
    return (
      <ReuseRecycleScreen
        onBack={goHome}
        onLeaveReview={(target) => {
          setReviewTarget(target);
          setRouteBeforeWriteReview('ReuseRecycle');
          setAppRoute('WriteReview');
        }}
        initialTab={reuseRecycleInitialTab}
        initialActionType={reuseRecycleInitialAction}
      />
    );
  }
  if (appRoute === 'Reviews' && reviewsOf) {
    return (
      <ReviewsScreen
        userId={reviewsOf.userId}
        userName={reviewsOf.userName}
        onBack={() => setAppRoute(routeBeforeReviews)}
      />
    );
  }
  if (appRoute === 'Conversations') {
    return withTabs(
      'messages',
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
  if (appRoute === 'ProblemReports' && hasRole('ADMIN')) {
    return <ProblemReportsScreen onBack={goHome} />;
  }
  if (appRoute === 'PostItem') {
    return <PostItemScreen onBack={goHome} onPosted={openItem} initialDraft={postItemInitialDraft} />;
  }
  if (appRoute === 'MyItems') {
    return (
      <MyItemsScreen
        onBack={goHome}
        onCreateItem={() => setAppRoute('PostItem')}
        onOpenItem={openItem}
      />
    );
  }
  if (appRoute === 'BrowseItems') {
    return <BrowseItemsScreen onBack={goHome} onOpenItem={openItem} />;
  }
  if (appRoute === 'ItemDetails' && selectedItemId) {
    return <ItemDetailsScreen itemId={selectedItemId} onBack={goHome} />;
  }
  if (appRoute === 'Member3') {
    return withTabs(
      'discover',
      <Member3Navigator
        onNavigateBack={goHome}
        onNavigateToModule4={(providerId, category) => {
          Alert.alert(
            'Handoff to Member 4 (Repair)',
            `Booking service provider: ${providerId || 'Selected Provider'} for ${category || 'Device'}`
          );
        }}
        onNavigateToModule5={(actionType, _draft) => {
          const act = String(actionType || '').toUpperCase();
          if (act === 'SELL' || act === 'DONATE') {
            setReuseRecycleInitialTab('CREATE');
            setReuseRecycleInitialAction(act as any);
          } else if (act === 'RECYCLE') {
            setReuseRecycleInitialTab('RECYCLE');
            setReuseRecycleInitialAction('RECYCLE');
          } else {
            setReuseRecycleInitialTab('BROWSE');
            setReuseRecycleInitialAction('REUSE');
          }
          setAppRoute('ReuseRecycle');
        }}
        onNavigateToModule2={(itemDraft) => {
          setPostItemInitialDraft(itemDraft);
          setAppRoute('PostItem');
        }}
      />
    );
  }

  return withTabs(
    'home',
    <HomeScreen
      onOpenProfile={() => setAppRoute('Profile')}
      onOpenEcoImpact={() => setAppRoute('EcoImpact')}
      onOpenNotifications={() => setAppRoute('Notifications')}
      onOpenMessages={() => setAppRoute('Conversations')}
      onOpenAdmin={() => setAppRoute('AdminUsers')}
      onOpenProblemReports={() => setAppRoute('ProblemReports')}
      onOpenDiscovery={() => setAppRoute('Member3')}
      onOpenPostItem={() => setAppRoute('PostItem')}
      onOpenMyItems={() => setAppRoute('MyItems')}
      onOpenBrowseItems={() => setAppRoute('BrowseItems')}
      onOpenReuseRecycle={() => setAppRoute('ReuseRecycle')}
    />
  );
};

const styles = StyleSheet.create({
  tabScreen: { flex: 1, backgroundColor: COLORS.background },
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
});
