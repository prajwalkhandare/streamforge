import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/auth.service';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(credentials);
          const { user, token } = response.data;
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return { success: true, user };
        } catch (error) {
          set({
            isLoading: false,
            error: error.response?.data?.error?.message || 'Login failed',
          });
          return { success: false, error: error.response?.data?.error?.message };
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(userData);
          set({ isLoading: false });
          return { success: true, data: response.data };
        } catch (error) {
          set({
            isLoading: false,
            error: error.response?.data?.error?.message || 'Registration failed',
          });
          return { success: false, error: error.response?.data?.error?.message };
        }
      },

      logout: async () => {
        set({ isLoading: true });
        await authService.logout();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      updateUser: (updatedUser) => {
        set({ user: updatedUser });
        localStorage.setItem('user', JSON.stringify(updatedUser));
      },

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      // Check if token is valid
      checkAuth: () => {
        const token = authService.getToken();
        const user = authService.getUser();
        if (token && user) {
          set({
            user,
            token,
            isAuthenticated: true,
          });
        } else {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);