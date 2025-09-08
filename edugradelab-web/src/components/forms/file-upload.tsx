/**
 * File Upload Component
 * Vercel Blob Storage ile dosya yükleme
 * Mobil-uyumlu drag & drop desteği
 */

'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InlineLoading } from '@/components/ui/loading';
import { useAuthStore, useFileStore, useUIStore } from '@/store';
import { ApiResponse, UploadResponse } from '@/types';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, formatFileSize } from '@/lib/storage';
import { Upload, X, File, Image, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileWithPreview extends File {
  preview?: string;
  id: string;
}

export const FileUpload: React.FC = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, token } = useAuthStore();
  const { addFile } = useFileStore();
  const { addNotification } = useUIStore();

  /**
   * Dosya tipine göre icon döndürür
   */
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-8 h-8 text-blue-500" />;
    } else if (file.type === 'application/pdf') {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    return <File className="w-8 h-8 text-gray-500" />;
  };

  /**
   * Dosya validasyonu
   */
  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type as any)) {
      return 'Desteklenmeyen dosya tipi. Sadece JPG, PNG, WebP ve PDF dosyaları kabul edilir.';
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `Dosya boyutu çok büyük. Maksimum ${formatFileSize(MAX_FILE_SIZE)} olabilir.`;
    }
    
    return null;
  };

  /**
   * Dosya önizlemesi oluşturur
   */
  const createFilePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  /**
   * Dosyaları handle et
   */
  const handleFiles = useCallback(async (fileList: FileList) => {
    const newFiles: FileWithPreview[] = [];
    const errors: string[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const error = validateFile(file);
      
      if (error) {
        errors.push(`${file.name}: ${error}`);
        continue;
      }

      const fileWithPreview = file as FileWithPreview;
      fileWithPreview.id = Math.random().toString(36).substring(2, 15);
      fileWithPreview.preview = await createFilePreview(file);
      
      newFiles.push(fileWithPreview);
    }

    if (errors.length > 0) {
      addNotification({
        type: 'error',
        title: 'Dosya Hatası',
        message: errors.join('\n'),
        duration: 7000,
      });
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
    }
  }, [addNotification]);

  /**
   * Drag & Drop handlers
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const fileList = e.dataTransfer.files;
    if (fileList.length > 0) {
      handleFiles(fileList);
    }
  }, [handleFiles]);

  /**
   * File input handler
   */
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      handleFiles(fileList);
    }
    // Input'u temizle
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFiles]);

  /**
   * Dosya silme
   */
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
    setUploadProgress(prev => {
      const { [fileId]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  /**
   * Dosya yükleme
   */
  const uploadFiles = useCallback(async () => {
    if (!user || !token || files.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of files) {
        setUploadProgress(prev => ({ ...prev, [file.id]: 0 }));

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/uploads', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`${file.name} yüklenemedi`);
        }

        const result: ApiResponse<UploadResponse> = await response.json();

        if (result.success && result.data) {
          // Progress'i 100'e çıkar
          setUploadProgress(prev => ({ ...prev, [file.id]: 100 }));
          
          // Store'a ekle
          addFile(result.data.file);
          
          addNotification({
            type: 'success',
            title: 'Dosya Yüklendi',
            message: `${file.name} başarıyla yüklendi ve analiz için gönderildi.`,
          });
        }
      }

      // Başarılı yüklemelerden sonra listeyi temizle
      setFiles([]);
      setUploadProgress({});
      
    } catch (error) {
      console.error('Upload error:', error);
      
      addNotification({
        type: 'error',
        title: 'Yükleme Hatası',
        message: error instanceof Error ? error.message : 'Dosya yükleme sırasında hata oluştu',
      });
    } finally {
      setIsUploading(false);
    }
  }, [user, token, files, addFile, addNotification]);

  return (
    <Card variant="outlined" className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Sınav Kağıdı Yükle
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer",
            "hover:border-blue-400 hover:bg-blue-50",
            isDragOver && "border-blue-500 bg-blue-100",
            "focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className={cn(
            "w-12 h-12 mx-auto mb-4 text-gray-400",
            isDragOver && "text-blue-500"
          )} />
          
          <p className="text-lg font-medium text-gray-700 mb-2">
            Dosyaları buraya sürükleyin
          </p>
          
          <p className="text-sm text-gray-500 mb-4">
            veya bilgisayarınızdan seçmek için tıklayın
          </p>
          
          <Button variant="outline" type="button" disabled={isUploading}>
            Dosya Seç
          </Button>
          
          <p className="text-xs text-gray-400 mt-3">
            Desteklenen formatlar: JPG, PNG, WebP, PDF<br />
            Maksimum dosya boyutu: {formatFileSize(MAX_FILE_SIZE)}
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_FILE_TYPES.join(',')}
            multiple
            onChange={handleFileInput}
            className="hidden"
            disabled={isUploading}
          />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700">Seçilen Dosyalar:</h4>
            
            {files.map((file) => {
              const progress = uploadProgress[file.id] ?? 0;
              const isCompleted = progress === 100;
              
              return (
                <div key={file.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {/* File Icon/Preview */}
                  <div className="flex-shrink-0">
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      getFileIcon(file)
                    )}
                  </div>
                  
                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                    
                    {/* Progress Bar */}
                    {isUploading && progress > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {progress}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Status/Actions */}
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : isUploading && progress > 0 ? (
                      <InlineLoading size="sm" />
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        disabled={isUploading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload Button */}
        {files.length > 0 && (
          <div className="flex justify-end">
            <Button
              onClick={uploadFiles}
              loading={isUploading}
              disabled={isUploading || files.length === 0}
            >
              {isUploading ? 'Yükleniyor...' : `${files.length} Dosyayı Yükle`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
