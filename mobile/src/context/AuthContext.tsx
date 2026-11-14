import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ApiError,
  authService,
  clearSessionToken,
  disableBiometricLogin,
  enableBiometricLogin,
  isBiometricLoginEnabled,
  loadSessionToken,
  saveSessionToken,
  setAuthToken,
  setUnauthorizedHandler,
  unlockWithBiometrics,
} from '../services';
import { LoginCredentials, RegisterData, UpdateProfileData, User, UserRole } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  /** True while a saved session is being restored at app start. */
  isRestoring: boolean;
  /** True when a fingerprint-protected token is saved on this phone. */
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

/**
 * Holds the signed-in user and token for the whole app.
 * The token is saved in encrypted storage, so the user stays signed in after the
 * app restarts. Optionally a fingerprint-protected copy allows fingerprint login.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  const clearSession = useCallback(() => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    clearSessionToken();
  }, []);

  const startSession = useCallback((newToken: string, newUser: User) => {
    setAuthToken(newToken);
    setToken(newToken);
    setUser(newUser);
    saveSessionToken(newToken);
  }, []);

  /** Load the user for a saved token; on 401 the token is no longer valid. */
  const resumeSession = useCallback(
    async (savedToken: string) => {
      setAuthToken(savedToken);
      startSession(savedToken, await authService.getMe());
    },
    [startSession]
  );

  // An expired or invalid token (401 from any API call) signs the user out everywhere,
  // and the saved fingerprint copy is useless too.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      disableBiometricLogin();
      setIsBiometricEnabled(false);
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  // App start: restore a saved session, if any.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsBiometricEnabled(await isBiometricLoginEnabled());
      const savedToken = await loadSessionToken();
      if (savedToken) {
        try {
          await resumeSession(savedToken);
        } catch {
          // Offline or expired: show the login screen. A 401 already cleared storage.
          setAuthToken(null);
        }
      }
      if (!cancelled) setIsRestoring(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [resumeSession]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const result = await authService.login(credentials);
      startSession(result.token, result.user);
    },
    [startSession]
  );

  const loginWithBiometrics = useCallback(async () => {
    const savedToken = await unlockWithBiometrics();
    if (!savedToken) return false;
    try {
      await resumeSession(savedToken);
      return true;
    } catch (error) {
      setAuthToken(null);
      if (error instanceof ApiError && error.status === 401) {
        throw new ApiError(
          'Fingerprint login has expired. Please sign in with your password.',
          401,
          'BIOMETRIC_EXPIRED'
        );
      }
      throw error;
    }
  }, [resumeSession]);

  const register = useCallback(
    async (data: RegisterData) => {
      const result = await authService.register(data);
      startSession(result.token, result.user);
    },
    [startSession]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // The local session is cleared even if the server can't be reached.
    }
    clearSession();
  }, [clearSession]);

  const setBiometricEnabled = useCallback(
    async (enabled: boolean) => {
      if (!enabled) {
        await disableBiometricLogin();
        setIsBiometricEnabled(false);
        return true;
      }
      if (!token) return false;
      const saved = await enableBiometricLogin(token);
      setIsBiometricEnabled(saved);
      return saved;
    },
    [token]
  );

  const updateProfile = useCallback(async (data: UpdateProfileData) => {
    setUser(await authService.updateMe(data));
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
