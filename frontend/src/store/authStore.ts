/**
 * NexusOne AI - Auth Store (Zustand)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '@/services/api';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: object) => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  fetchProfile: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
          set({ isLoading: true, error: null });
          try {
            const response = await authAPI.login(email, password);
            const data = response.data;
            
            // Handle both response formats
            const tokens = data.tokens || { access: data.access, refresh: data.refresh };
            const user = data.user || data;
            
            localStorage.setItem('access_token', tokens.access);
            localStorage.setItem('refresh_token', tokens.refresh);
            set({ user, isAuthenticated: true, isLoading: false });
          } catch (error: any) {
            const message = error.response?.data?.detail || 
                            error.response?.data?.non_field_errors?.[0] ||
                            'Login failed. Please check your credentials.';
            set({ error: message, isLoading: false });
            throw error;
          }
        },
      logout: async () => {
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) await authAPI.logout(refreshToken);
        } catch (_) {}
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, isAuthenticated: false });
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.register(data);
          const { user, tokens } = response.data;
          localStorage.setItem('access_token', tokens.access);
          localStorage.setItem('refresh_token', tokens.refresh);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
          const errors = error.response?.data;
          const message = Object.values(errors || {})[0] as string || 'Registration failed.';
          set({ error: Array.isArray(message) ? message[0] : message, isLoading: false });
          throw error;
        }
      },

      fetchProfile: async () => {
        try {
          const response = await authAPI.getProfile();
          set({ user: response.data, isAuthenticated: true });
        } catch (_) {
          set({ user: null, isAuthenticated: false });
        }
      },

      updateUser: (userData) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...userData } });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'nexusone-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
