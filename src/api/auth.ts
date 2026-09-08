import { api } from './client';
import { User, LoginCredentials, AuthSession } from '../types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthSession> => {
    return api.request<AuthSession>('auth/login', credentials);
  },

  logout: async (): Promise<void> => {
    return api.request<void>('auth/logout');
  },

  checkSession: async (): Promise<User> => {
    return api.request<User>('auth/check-session');
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    return api.request<{ message: string }>('auth/forgot-password', { email });
  },

  resetPassword: async (password: string, token: string): Promise<{ message: string }> => {
    return api.request<{ message: string }>('auth/reset-password', { password, token });
  },

  // Admin CRUD for Teachers
  getTeachers: async (): Promise<User[]> => {
    return api.request<User[]>('teachers/list');
  },

  createTeacherAccount: async (data: Omit<User, 'user_id' | 'created_at'> & { password?: string }): Promise<User> => {
    return api.request<User>('teachers/create', data);
  },

  updateTeacherAccount: async (userId: string, data: Partial<User> & { password?: string }): Promise<User> => {
    return api.request<User>('teachers/update', { userId, ...data });
  },
};
