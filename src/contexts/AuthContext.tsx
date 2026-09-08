import React, { createContext, useState, useEffect, useContext } from 'react';
import { User, LoginCredentials } from '../types';
import { authApi } from '../api/auth';
import { api } from '../api/client';
import { STORAGE_KEYS } from '../utils/constants';

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

  // Check storage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const storedUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER);

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          setLoading(false); // Unblock UI immediately using stored user
          
          // Warm up cache in background
          prefetchDatabaseData();

          // Validate fresh session silently in background without hanging UI
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
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
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
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, session.token);
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(session.user));
      
      // Warm up cache immediately upon login
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
      setUser(null);
      setToken(null);
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (updatedData: { name: string; email: string }) => {
    if (!user) return;
    const newSessionUser: User = {
      ...user,
      name: updatedData.name,
      email: updatedData.email,
    };
    setUser(newSessionUser);
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(newSessionUser));

    // Persist to backend if teacher/user profile is stored in backend
    try {
      await api.request('teachers/update', {
        id: user.user_id,
        name: updatedData.name,
        email: updatedData.email,
      });
    } catch (e) {
      console.warn('Teacher update API call handled locally:', e);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login: handleLogin,
        logout: handleLogout,
        updateProfile: handleUpdateProfile,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
