/**
 * File Upload Component
 * Sınav kağıdı yükleme için basit drag & drop component
 * SSR-safe, useId kullanıyor
 */

'use client';

import React, { useState, useCallback, useRef, useId } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotificationStore } from '@/store/notifications';

interface FileWithPreview extends File {
  id: string;
  preview?: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function FileUpload() {
  const componentId = useId();
  const { addNotification } = useNotificationStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Dosya validasyonu
  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Sadece JPG, JPEG ve PNG dosyaları kabul edilir.';
    }
    if (file.size > MAX_SIZE) {
      return 'Dosya boyutu 10MB\'dan büyük olamaz.';
    }
    return null;
  };

  // Dosya önizleme oluştur
  const createPreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  };

  // Dosya işleme
  const processFiles = async (fileList: FileList) => {
    const newFiles: FileWithPreview[] = [];
    const errors: string[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const error = validateFile(file);
      
      if (error) {
        errors.push(`${file.name}: ${error}`);
        continue;
      }

      // SSR-safe ID generation
      const fileWithPreview = file as FileWithPreview;
      fileWithPreview.id = `${componentId}-file-${Date.now()}-${i}`;
      fileWithPreview.preview = await createPreview(file);
      
      newFiles.push(fileWithPreview);
    }

    if (errors.length > 0) {
      addNotification({
        type: 'error',
        title: 'Dosya Hatası',
        message: errors.join('\n'),
      });
    }

    setFiles(prev => [...prev, ...newFiles]);
  };

  // Drag & Drop handlers
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
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  }, [componentId]);

  // File input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      processFiles(selectedFiles);
    }
  };

  // Dosya silme
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  // Dosya yükleme
  const uploadFiles = async () => {
    if (files.length === 0) {
      addNotification({
        type: 'warning',
        title: 'Uyarı',
        message: 'Lütfen en az bir dosya seçin',
      });
      return;
    }

    setIsUploading(true);

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/uploads', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`${file.name} yüklenemedi`);
        }
      }

      addNotification({
        type: 'success',
        title: 'Başarılı',
        message: 'Dosyalar başarıyla yüklendi',
      });

      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Upload Hatası',
        message: error instanceof Error ? error.message : 'Dosya yüklenemedi',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Sınav Kağıdı Yükle
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${isDragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className={`
            w-12 h-12 mx-auto mb-4
            ${isDragOver ? 'text-blue-500' : 'text-gray-400'}
          `} />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Dosyaları buraya sürükleyin
          </p>
          <p className="text-sm text-gray-500 mb-4">
            veya tıklayarak dosya seçin
          </p>
          <p className="text-xs text-gray-400">
            JPG, JPEG, PNG • Maksimum 10MB
          </p>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Seçilen Dosyalar:</h4>
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                {file.preview ? (
                  <img 
                    src={file.preview} 
                    alt={file.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <FileText className="w-12 h-12 text-gray-400" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFile(file.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {files.length > 0 && (
          <Button 
            onClick={uploadFiles}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Yükleniyor...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {files.length} Dosya Yükle
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
