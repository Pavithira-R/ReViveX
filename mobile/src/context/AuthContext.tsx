// Member 1 – Authentication & User Management (Firebase session)
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  ApiError,
  authService,
  clearOfflineData,
  disableBiometricLogin,
  enableBiometricLogin,
  isBiometricLoginEnabled,
  isOfflineError,
  recallUser,
  rememberUser,
  unlockWithBiometrics,
} from '../services';
import { auth } from '../services/firebase';
import { LoginCredentials, RegisterData, UpdateProfileData, User, UserRole } from '../types';

interface AuthContextValue {
  user: User | null;
  /** Firebase user id of the signed-in user (kept as `token` so screens don't change). */
  token: string | null;
  isAuthenticated: boolean;
  /** True while a saved session is being restored at app start. */
  isRestoring: boolean;
  /** True when fingerprint-protected sign-in details are saved on this phone. */
  isBiometricEnabled: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  /** Returns false if the scan was cancelled or failed (show the password form). */
  loginWithBiometrics: () => Promise<boolean>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<boolean>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const parseSavedCredentials = (saved: string): LoginCredentials | null => {
  try {
    const parsed = JSON.parse(saved);
    return typeof parsed?.email === 'string' && typeof parsed?.password === 'string' ? parsed : null;
  } catch {
    return null;
  }
};

/**
 * Holds the signed-in user for the whole app.
 * Firebase keeps the session after the app restarts. Fingerprint login keeps the
 * email and password in fingerprint-protected encrypted storage on this phone only.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  /** Sign-in details from this app run, needed to turn fingerprint login on. Memory only. */
  const lastCredentials = useRef<LoginCredentials | null>(null);

  const clearSession = useCallback(() => {
    lastCredentials.current = null;
    setToken(null);
    setUser(null);
    clearOfflineData();
  }, []);

  const startSession = useCallback((uid: string, newUser: User) => {
    setToken(uid);
    setUser(newUser);
    rememberUser(newUser);
  }, []);

  // App start: Firebase tells us whether a user is still signed in.
  // Later "signed out" events (logout, deactivation) clear the session.
  useEffect(() => {
    let restored = false;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (restored) {
        if (!firebaseUser) clearSession();
        return;
      }
      restored = true;
      setIsBiometricEnabled(await isBiometricLoginEnabled());
      if (firebaseUser) {
        try {
          const profile = await authService.getMe();
          if (profile.isActive) startSession(firebaseUser.uid, profile);
          else await authService.logout();
        } catch (error) {
          // Without internet, open with the last saved profile so saved data can be viewed offline.
          const lastUser = isOfflineError(error) ? await recallUser() : null;
          if (lastUser) startSession(firebaseUser.uid, lastUser);
        }
      }
      setIsRestoring(false);
    });
    return unsubscribe;
  }, [clearSession, startSession]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const result = await authService.login(credentials);
      lastCredentials.current = credentials;
      startSession(result.token, result.user);
    },
    [startSession]
  );

  const loginWithBiometrics = useCallback(async () => {
    const saved = await unlockWithBiometrics();
    if (!saved) return false;
    const credentials = parseSavedCredentials(saved);
    try {
      if (!credentials) throw new ApiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
      await login(credentials);
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        // The password was changed (or the saved copy is unreadable): the copy is useless now.
        await disableBiometricLogin();
        setIsBiometricEnabled(false);
        throw new ApiError(
          'Fingerprint login has expired. Please sign in with your password.',
          401,
          'BIOMETRIC_EXPIRED'
        );
      }
      throw error;
    }
  }, [login]);

  const register = useCallback(
    async (data: RegisterData) => {
      const result = await authService.register(data);
      lastCredentials.current = { email: data.email, password: data.password };
      startSession(result.token, result.user);
    },
    [startSession]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // The local session is cleared even if Firebase can't be reached.
    }
    clearSession();
  }, [clearSession]);

  const setBiometricEnabled = useCallback(async (enabled: boolean) => {
    if (!enabled) {
      await disableBiometricLogin();
      setIsBiometricEnabled(false);
      return true;
    }
    if (!lastCredentials.current) {
      throw new ApiError(
        'For your security, sign out and sign in with your password once, then turn fingerprint login on.',
        400,
        'PASSWORD_REQUIRED'
      );
    }
    const saved = await enableBiometricLogin(JSON.stringify(lastCredentials.current));
    setIsBiometricEnabled(saved);
    return saved;
  }, []);

  const updateProfile = useCallback(async (data: UpdateProfileData) => {
    const updated = await authService.updateMe(data);
    setUser(updated);
    rememberUser(updated);
  }, []);

  const refreshProfile = useCallback(async () => {
    setUser(await authService.getMe());
  }, []);

  const hasRole = useCallback(
    (...roles: UserRole[]) => !!user && roles.includes(user.role),
    [user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!token && !!user,
      isRestoring,
      isBiometricEnabled,
      login,
      loginWithBiometrics,
      register,
      logout,
      setBiometricEnabled,
      updateProfile,
      refreshProfile,
      hasRole,
    }),
    [
      user,
      token,
      isRestoring,
      isBiometricEnabled,
      login,
      loginWithBiometrics,
      register,
      logout,
      setBiometricEnabled,
      updateProfile,
      refreshProfile,
      hasRole,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/** Access the auth state from any screen: `const { user, logout } = useAuth();` */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
};
