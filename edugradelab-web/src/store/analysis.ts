/**
 * Analysis Store
 * Sınav analizi state management
 * Zustand ile - Client-side only
 */

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Analysis, Upload, ExamAnalysisResult, ApiResponse } from '@/types';

interface AnalysisState {
  analyses: Analysis[];
  uploads: Upload[];
  currentAnalysis: Analysis | null;
  isAnalyzing: boolean;
  error: string | null;
}

interface AnalysisActions {
  startAnalysis: (uploadId: number) => Promise<void>;
  getAnalysis: (analysisId: number) => Promise<void>;
  getAnalyses: () => Promise<void>;
  getUploads: () => Promise<void>;
  clearError: () => void;
  setCurrentAnalysis: (analysis: Analysis | null) => void;
}

type AnalysisStore = AnalysisState & AnalysisActions;

export const useAnalysisStore = create<AnalysisStore>()(
  persist(
    (set, get) => ({
      // Initial state
      analyses: [],
      uploads: [],
      currentAnalysis: null,
      isAnalyzing: false,
      error: null,

      // Actions
      startAnalysis: async (uploadId: number) => {
        set({ isAnalyzing: true, error: null });

        try {
          const response = await fetch('/api/analysis/start', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uploadId }),
          });

          const result: ApiResponse<Analysis> = await response.json();

          if (!result.success || !result.data) {
            throw new Error(result.message || 'Analiz başlatılamadı');
          }

          set(state => ({
            analyses: [...state.analyses, result.data!],
            currentAnalysis: result.data!,
            isAnalyzing: false,
          }));

        } catch (error) {
          set({
            isAnalyzing: false,
            error: error instanceof Error ? error.message : 'Bir hata oluştu',
          });
          throw error;
        }
      },

      getAnalysis: async (analysisId: number) => {
        try {
          const response = await fetch(`/api/analysis/${analysisId}`);
          const result: ApiResponse<Analysis> = await response.json();

          if (!result.success || !result.data) {
            throw new Error(result.message || 'Analiz bulunamadı');
          }

          set({ currentAnalysis: result.data });

        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Bir hata oluştu',
          });
          throw error;
        }
      },

      getAnalyses: async () => {
        try {
          const response = await fetch('/api/analysis');
          const result: ApiResponse<Analysis[]> = await response.json();

          if (!result.success || !result.data) {
            throw new Error(result.message || 'Analizler yüklenemedi');
          }

          set({ analyses: result.data });

        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Bir hata oluştu',
          });
        }
      },

      getUploads: async () => {
        try {
          const response = await fetch('/api/uploads');
          const result: ApiResponse<Upload[]> = await response.json();

          if (!result.success || !result.data) {
            throw new Error(result.message || 'Yüklemeler alınamadı');
          }

          set({ uploads: result.data });

        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Bir hata oluştu',
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setCurrentAnalysis: (analysis: Analysis | null) => {
        set({ currentAnalysis: analysis });
      },
    }),
    {
      name: 'analysis-storage',
      partialize: (state) => ({
        analyses: state.analyses,
        uploads: state.uploads,
        currentAnalysis: state.currentAnalysis,
      }),
    }
  )
);
