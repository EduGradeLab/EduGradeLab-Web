/**
 * Dashboard Ana Sayfası
 * Dosya yükleme ve analiz sonuçları gösterimi
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from '@/components/forms/file-upload';
import { useAuthStore, useFileStore, useAnalysisStore, useUIStore } from '@/store';
import { UploadedFile, AnalysisResult, ApiResponse } from '@/types';
import { 
  Upload, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Download,
  LogOut,
  User,
  Settings,
  BarChart3,
  History
} from 'lucide-react';
import { formatFileSize } from '@/lib/storage';

export default function DashboardPage() {
  const { user, token, logout } = useAuthStore();
  const { files, setFiles } = useFileStore();
  const { results, setResults } = useAnalysisStore();
  const { addNotification } = useUIStore();
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Dosyaları ve analiz sonuçlarını yükle
   */
  const loadData = async () => {
    if (!token) return;

    try {
      setIsLoading(true);

      // Dosyaları yükle
      const filesResponse = await fetch('/api/uploads', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (filesResponse.ok) {
        const filesResult: ApiResponse<{ files: UploadedFile[] }> = await filesResponse.json();
        if (filesResult.success && filesResult.data) {
          setFiles(filesResult.data.files);
        }
      }

      // Analiz sonuçlarını yükle
      const analysisResponse = await fetch('/api/analysis', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (analysisResponse.ok) {
        const analysisResult: ApiResponse<{ analyses: AnalysisResult[] }> = await analysisResponse.json();
        if (analysisResult.success && analysisResult.data) {
          setResults(analysisResult.data.analyses);
        }
      }

    } catch (error) {
      console.error('Data loading error:', error);
      addNotification({
        type: 'error',
        title: 'Yükleme Hatası',
        message: 'Veriler yüklenirken hata oluştu',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  /**
   * Polling için analiz sonuçlarını güncelle
   */
  useEffect(() => {
    if (!token) return;

    const pollAnalysisResults = async () => {
      try {
        const response = await fetch('/api/analysis', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const result: ApiResponse<{ analyses: AnalysisResult[] }> = await response.json();
          if (result.success && result.data) {
            setResults(result.data.analyses);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Her 10 saniyede bir kontrol et
    const interval = setInterval(pollAnalysisResults, 10000);

    return () => clearInterval(interval);
  }, [token, setResults]);

  /**
   * Çıkış yap
   */
  const handleLogout = () => {
    logout();
    addNotification({
      type: 'success',
      title: 'Çıkış Yapıldı',
      message: 'Başarıyla çıkış yaptınız',
    });
  };

  /**
   * Dosya durumu iconları
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'scanning':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'analyzing':
        return <BarChart3 className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  /**
   * Dosya durumu metni
   */
  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploaded':
        return 'Yüklendi';
      case 'scanning':
        return 'Taranıyor...';
      case 'analyzing':
        return 'Analiz ediliyor...';
      case 'completed':
        return 'Tamamlandı';
      case 'error':
        return 'Hata';
      default:
        return 'Bilinmiyor';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Dashboard yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">EduGradeLab</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user?.name}</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {user?.role === 'admin' ? 'Admin' : 'Öğretmen'}
                </span>
              </div>
              
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
              
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Sınav Kağıdı Yükle</h2>
              <p className="text-gray-600">
                Sınav kağıtlarınızı yükleyin ve AI destekli analiz sonuçlarını alın.
              </p>
            </div>
            
            <FileUpload />
          </div>

          {/* Stats Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  İstatistikler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Toplam Dosya</span>
                    <span className="font-semibold">{files.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tamamlanan</span>
                    <span className="font-semibold text-green-600">
                      {files.filter(f => f.status === 'completed').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">İşleniyor</span>
                    <span className="font-semibold text-blue-600">
                      {files.filter(f => ['scanning', 'analyzing'].includes(f.status)).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ortalama Puan</span>
                    <span className="font-semibold">
                      {results.length > 0 
                        ? (results.reduce((acc, r) => acc + (r.score || 0), 0) / results.length).toFixed(1)
                        : '0.0'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Files Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5" />
              Son Yüklenen Dosyalar
            </h3>
            <Button variant="outline" size="sm">
              Tümünü Görüntüle
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {files.slice(0, 6).map((file) => {
              const analysis = results.find(r => r.fileId === file.id);
              
              return (
                <Card key={file.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-medium truncate">
                          {file.originalName}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {formatFileSize(file.fileSize)} • {new Date(file.createdAt).toLocaleDateString('tr-TR')}
                        </CardDescription>
                      </div>
                      {getStatusIcon(file.status)}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Durum:</span>
                        <span className={`font-medium ${
                          file.status === 'completed' ? 'text-green-600' :
                          file.status === 'error' ? 'text-red-600' :
                          'text-blue-600'
                        }`}>
                          {getStatusText(file.status)}
                        </span>
                      </div>
                      
                      {analysis && analysis.score !== null && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Puan:</span>
                          <span className="font-semibold text-green-600">
                            {analysis.score}/100
                          </span>
                        </div>
                      )}
                      
                      {file.status === 'completed' && analysis && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <FileText className="w-3 h-3 mr-1" />
                            Detay
                          </Button>
                          {analysis.pdfUrl && (
                            <Button size="sm" variant="outline">
                              <Download className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {files.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Henüz dosya yüklemediniz
                </h4>
                <p className="text-gray-500 mb-4">
                  İlk sınav kağıdınızı yükleyerek analiz sürecini başlatın.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
