/**
 * Zustand global state management
 * Kullanıcı authentication ve uygulama state'i için
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UploadedFile, AnalysisResult } from '@/types';

// Authentication Store
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      login: (user: User, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates },
          });
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

// File Upload Store
interface FileState {
  files: UploadedFile[];
  uploadProgress: Record<string, number>;
  isUploading: boolean;
  addFile: (file: UploadedFile) => void;
  updateFile: (fileId: number, updates: Partial<UploadedFile>) => void;
  removeFile: (fileId: number) => void;
  setFiles: (files: UploadedFile[]) => void;
  setUploadProgress: (fileId: string, progress: number) => void;
  setUploading: (uploading: boolean) => void;
  clearUploadProgress: (fileId: string) => void;
}

export const useFileStore = create<FileState>((set, get) => ({
  files: [],
  uploadProgress: {},
  isUploading: false,

  addFile: (file: UploadedFile) => {
    set((state) => ({
      files: [file, ...state.files],
    }));
  },

  updateFile: (fileId: number, updates: Partial<UploadedFile>) => {
    set((state) => ({
      files: state.files.map((file) =>
        file.id === fileId ? { ...file, ...updates } : file
      ),
    }));
  },

  removeFile: (fileId: number) => {
    set((state) => ({
      files: state.files.filter((file) => file.id !== fileId),
    }));
  },

  setFiles: (files: UploadedFile[]) => {
    set({ files });
  },

  setUploadProgress: (fileId: string, progress: number) => {
    set((state) => ({
      uploadProgress: {
        ...state.uploadProgress,
        [fileId]: progress,
      },
    }));
  },

  setUploading: (uploading: boolean) => {
    set({ isUploading: uploading });
  },

  clearUploadProgress: (fileId: string) => {
    set((state) => {
      const { [fileId]: removed, ...rest } = state.uploadProgress;
      return { uploadProgress: rest };
    });
  },
}));

// Analysis Results Store
interface AnalysisState {
  results: AnalysisResult[];
  isLoading: boolean;
  pollingInterval: number | null;
  addResult: (result: AnalysisResult) => void;
  updateResult: (resultId: number, updates: Partial<AnalysisResult>) => void;
  setResults: (results: AnalysisResult[]) => void;
  setLoading: (loading: boolean) => void;
  startPolling: (interval: number) => void;
  stopPolling: () => void;
  getResultByFileId: (fileId: number) => AnalysisResult | undefined;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  results: [],
  isLoading: false,
  pollingInterval: null,

  addResult: (result: AnalysisResult) => {
    set((state) => ({
      results: [result, ...state.results],
    }));
  },

  updateResult: (resultId: number, updates: Partial<AnalysisResult>) => {
    set((state) => ({
      results: state.results.map((result) =>
        result.id === resultId ? { ...result, ...updates } : result
      ),
    }));
  },

  setResults: (results: AnalysisResult[]) => {
    set({ results });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  startPolling: (interval: number) => {
    set({ pollingInterval: interval });
  },

  stopPolling: () => {
    set({ pollingInterval: null });
  },

  getResultByFileId: (fileId: number) => {
    return get().results.find((result) => result.fileId === fileId);
  },
}));

// UI State Store (modal, sidebar, notifications vb.)
interface UIState {
  isSidebarOpen: boolean;
  activeModal: string | null;
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: Date;
    duration?: number;
  }>;
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  isSidebarOpen: false,
  activeModal: null,
  notifications: [],

  toggleSidebar: () => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },

  setSidebar: (open: boolean) => {
    set({ isSidebarOpen: open });
  },

  openModal: (modalId: string) => {
    set({ activeModal: modalId });
  },

  closeModal: () => {
    set({ activeModal: null });
  },

  addNotification: (notification) => {
    const id = Math.random().toString(36).substring(2, 15);
    const newNotification = {
      ...notification,
      id,
      timestamp: new Date(),
    };

    set((state) => ({
      notifications: [newNotification, ...state.notifications].slice(0, 10), // Maksimum 10 notification
    }));

    // Auto-remove after duration
    if (notification.duration !== 0) {
      const duration = notification.duration || 5000;
      setTimeout(() => {
        get().removeNotification(id);
      }, duration);
    }
  },

  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },
}));
