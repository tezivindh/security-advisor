import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { authApi } from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  fetchMe: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,
      isAuthenticated: false,

      setToken: (token: string) => {
        localStorage.setItem('secops_token', token);
        set({ token, isAuthenticated: true });
      },

      fetchMe: async () => {
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem('secops_token') : null;
        if (!get().token && !storedToken) {
          set({ isLoading: false });
          return;
        }
        set({ isLoading: true });
        try {
          const { data } = await authApi.me();
          set({ user: data, isAuthenticated: true, isLoading: false });
        } catch {
          set({ user: null, isAuthenticated: false, token: null, isLoading: false });
          localStorage.removeItem('secops_token');
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {}
        localStorage.removeItem('secops_token');
        set({ user: null, token: null, isAuthenticated: false });
        window.location.href = '/';
      },
    }),
    {
      name: 'secops-auth',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
