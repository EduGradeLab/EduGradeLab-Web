/**
 * Dashboard Ana Sayfası
 * Dosya yükleme ve analiz sonuçları gösterimi - Basitleştirilmiş versiyon
 */

'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FileUpload from '@/components/forms/file-upload';
import { useAuthStore } from '@/store/auth';
import { useNotificationStore } from '@/store/notifications';
import { useAnalysisStore } from '@/store/analysis';
import { 
  Upload as UploadIcon, 
  FileText, 
  BarChart3, 
  Clock 
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { analyses, uploads, getAnalyses, getUploads } = useAnalysisStore();

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await getAnalyses();
        await getUploads();
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Veri Yükleme Hatası',
          message: 'Veriler yüklenirken bir hata oluştu',
        });
      }
    };

    if (user) {
      loadData();
    }
  }, [user, getAnalyses, getUploads, addNotification]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Giriş yapmanız gerekiyor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            EduGradeLab Dashboard
          </h1>
          <p className="text-gray-600">
            Hoş geldiniz, {user.username}!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Toplam Yükleme</h3>
              <UploadIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uploads.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Tamamlanan Analiz</h3>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyses.filter(a => a.status === 'completed').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">İşleniyor</h3>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyses.filter(a => ['pending', 'processing'].includes(a.status)).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Ortalama Puan</h3>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyses.filter(a => a.status === 'completed').length > 0 
                  ? '85.2' 
                  : '-'
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* File Upload Section */}
          <div className="space-y-6">
            <FileUpload />
          </div>

          {/* Recent Analyses */}
          <Card>
            <CardHeader>
              <CardTitle>Son Analizler</CardTitle>
            </CardHeader>
            <CardContent>
              {analyses.length > 0 ? (
                <div className="space-y-4">
                  {analyses.slice(0, 5).map((analysis) => (
                    <div key={analysis.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          Analiz #{analysis.id}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(analysis.created_at).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          analysis.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : analysis.status === 'processing'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {analysis.status === 'completed' && 'Tamamlandı'}
                          {analysis.status === 'processing' && 'İşleniyor'}
                          {analysis.status === 'pending' && 'Bekliyor'}
                          {analysis.status === 'error' && 'Hata'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Henüz analiz yok</p>
                  <p className="text-sm text-gray-400">
                    Başlamak için bir sınav kağıdı yükleyin
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
