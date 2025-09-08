/**
 * Vercel Blob Storage yardımcı fonksiyonları
 * Dosya upload ve yönetimi için
 */

import { put, del, head } from '@vercel/blob';

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

if (!BLOB_TOKEN) {
  throw new Error('BLOB_READ_WRITE_TOKEN environment variable is required');
}

/**
 * İzin verilen dosya tipleri ve boyutları
 */
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf'
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Dosya tipini doğrular
 */
export function validateFileType(mimeType: string): boolean {
  return (ALLOWED_FILE_TYPES as readonly string[]).includes(mimeType);
}

/**
 * Dosya boyutunu doğrular
 */
export function validateFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

/**
 * Güvenli dosya adı oluşturur
 */
export function generateSafeFileName(originalName: string, userId: number): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop()?.toLowerCase() || '';
  
  // Orijinal dosya adını temizle
  const cleanName = originalName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 50);
  
  return `user_${userId}/${timestamp}_${randomString}_${cleanName}${extension ? '.' + extension : ''}`;
}

/**
 * Dosyayı Vercel Blob'a yükler
 */
export async function uploadFile(
  file: File,
  userId: number
): Promise<{
  url: string;
  pathname: string;
  fileName: string;
  size: number;
  uploadedAt: Date;
}> {
  try {
    // Dosya validasyonları
    if (!validateFileType(file.type)) {
      throw new Error('Desteklenmeyen dosya tipi. Sadece JPG, PNG, WebP ve PDF dosyaları kabul edilir.');
    }
    
    if (!validateFileSize(file.size)) {
      throw new Error(`Dosya boyutu çok büyük. Maksimum ${MAX_FILE_SIZE / (1024 * 1024)}MB olabilir.`);
    }
    
    const fileName = generateSafeFileName(file.name, userId);
    
    const blob = await put(fileName, file, {
      access: 'public', // Public access olarak değiştirildi
      token: BLOB_TOKEN,
    });
    
    return {
      url: blob.url,
      pathname: blob.pathname,
      fileName,
      size: file.size,
      uploadedAt: new Date(),
    };
    
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Dosya yükleme sırasında hata oluştu'
    );
  }
}

/**
 * Dosyayı siler
 */
export async function deleteFile(url: string): Promise<void> {
  try {
    await del(url, { token: BLOB_TOKEN });
    console.log('File deleted successfully:', url);
  } catch (error) {
    console.error('File deletion error:', error);
    throw new Error('Dosya silme sırasında hata oluştu');
  }
}

/**
 * Dosya bilgilerini alır
 */
export async function getFileInfo(url: string): Promise<{
  url: string;
  size: number;
  uploadedAt: Date;
} | null> {
  try {
    const response = await head(url, { token: BLOB_TOKEN });
    
    return {
      url: response.url,
      size: response.size,
      uploadedAt: response.uploadedAt,
    };
  } catch (error) {
    console.error('Get file info error:', error);
    return null;
  }
}

/**
 * Dosya URL'sinden güvenli download URL oluşturur
 */
export function createSecureDownloadUrl(
  blobUrl: string,
  expiresInMinutes: number = 60
): string {
  // Bu fonksiyon ileride JWT token ile imzalanmış download URL'leri için kullanılabilir
  // Şu an için direct blob URL dönüyor
  console.log(`Creating secure download URL with ${expiresInMinutes} minutes expiry`);
  return blobUrl;
}

/**
 * Dosya metadata'sını çıkarır
 */
export function extractFileMetadata(file: File): {
  originalName: string;
  size: number;
  type: string;
  lastModified: number;
} {
  return {
    originalName: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
  };
}

/**
 * Dosya boyutunu human-readable formata çevirir
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Dosya uzantısından MIME type tahmin eder
 */
export function getMimeTypeFromExtension(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    pdf: 'application/pdf',
  };
  
  return mimeTypes[extension || ''] || 'application/octet-stream';
}
