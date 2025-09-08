/**
 * Auth Store
 * Kullanıcı kimlik doğrulama ve yetkilendirme state management
 * Zustand ile - Client-side only
 */

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, LoginResponse, RegisterFormData, ApiResponse } from '@/types';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  checkAuth: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const result: ApiResponse<LoginResponse> = await response.json();

          if (!result.success || !result.data) {
            throw new Error(result.message || 'Giriş başarısız');
          }

          const { user, token } = result.data;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Bir hata oluştu',
          });
          throw error;
        }
      },

      register: async (data: RegisterFormData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          const result: ApiResponse<LoginResponse> = await response.json();

          if (!result.success || !result.data) {
            throw new Error(result.message || 'Kayıt başarısız');
          }

          const { user, token } = result.data;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Bir hata oluştu',
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      checkAuth: () => {
        const { token, user } = get();
        
        if (token && user) {
          // Token geçerliliğini kontrol et (JWT decode)
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            
            if (payload.exp > currentTime) {
              set({ isAuthenticated: true });
            } else {
              // Token süresi dolmuş
              set({
                user: null,
                token: null,
                isAuthenticated: false,
              });
            }
          } catch {
            // Token bozuk
            set({
              user: null,
              token: null,
              isAuthenticated: false,
            });
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
