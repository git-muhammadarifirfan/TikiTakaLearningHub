import React, { createContext, useState, useEffect, useContext } from 'react';
import { User, LoginCredentials } from '../types';
import { authApi } from '../api/auth';
import { api } from '../api/client';
import { STORAGE_KEYS, FORTY_DAYS_MS } from '../utils/constants';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updatedData: { name: string; email: string }) => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Pre-fetch all key database data silently in background on login or app start
  const prefetchDatabaseData = async () => {
    try {
      api.request('students/list');
      api.request('subjects/list');
      api.request('schedules/list');
      api.request('dashboard/stats');
      api.request('teachers/list');
      api.request('makeup/list');
      api.request('reports/list');
      api.request('attendance/today');
    } catch (e) {}
  };

  const clearSessionStorage = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    localStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRES);
  };

  // Check storage and 40-day expiry on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const storedUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      const sessionExpiresStr = localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRES);

      if (storedToken && storedUser && sessionExpiresStr) {
        const expiresAt = parseInt(sessionExpiresStr, 10);
        const now = Date.now();

        // 40 hari expiry check
        if (now > expiresAt) {
          console.warn('Session expired (passed 40 days). Auto logging out.');
          clearSessionStorage();
          setLoading(false);
          return;
        }

        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          setLoading(false); // Unblock UI immediately
          
          // Warm up cache in background
          prefetchDatabaseData();

          // Validate fresh session silently in background
          authApi.checkSession().then((freshUser) => {
            if (freshUser) {
              setUser(freshUser);
              localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(freshUser));
            }
          }).catch((err) => {
            console.warn('Background session check failed, using cached session:', err);
          });
          return;
        } catch (e) {
          clearSessionStorage();
        }
      } else if (storedToken || storedUser) {
        // Migration support if old session exists without expiry date
        const expiresAt = Date.now() + FORTY_DAYS_MS;
        localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRES, expiresAt.toString());
        if (storedToken && storedUser) {
          try {
            setUser(JSON.parse(storedUser));
            setToken(storedToken);
          } catch (e) {}
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const handleLogin = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const session = await authApi.login(credentials);
      setUser(session.user);
      setToken(session.token);

      // Save 40-day session expiry timestamp
      const expiresAt = Date.now() + FORTY_DAYS_MS;
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, session.token);
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(session.user));
      localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRES, expiresAt.toString());
      
      prefetchDatabaseData();
    } catch (error: any) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      if (token) {
        await authApi.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearSessionStorage();
      setUser(null);
      setToken(null);
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (updatedData: { name: string; email: string }) => {
    if (!user) return;
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login: handleLogin,
        logout: handleLogout,
        updateProfile: handleUpdateProfile,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
