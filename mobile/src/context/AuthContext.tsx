import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService, setAuthToken, setUnauthorizedHandler } from '../services';
import { LoginCredentials, RegisterData, UpdateProfileData, User, UserRole } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Holds the signed-in user and token for the whole app.
 * The token is kept in memory for now; persisting it across app restarts
 * (AsyncStorage / Keychain) will be added once the team fixes the shared mobile setup.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const clearSession = useCallback(() => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const startSession = useCallback((newToken: string, newUser: User) => {
    setAuthToken(newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  // Any 401 from the API (expired token, account removed) signs the user out.
  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const result = await authService.login(credentials);
      startSession(result.token, result.user);
    },
    [startSession]
  );

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
      login,
      register,
      logout,
      updateProfile,
      refreshProfile,
      hasRole,
    }),
    [user, token, login, register, logout, updateProfile, refreshProfile, hasRole]
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
