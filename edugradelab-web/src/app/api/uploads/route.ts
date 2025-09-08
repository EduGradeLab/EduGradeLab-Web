/**
 * File Upload API Route
 * Vercel Blob S    // Dosyayı Vercel Blob'a yükle
    const uploadResult = await uploadFile(file, userPayload.userId);

    // Veritabanına kaydet
    const insertResult = await executeUpdate(
      'INSERT INTO uploads (user_id, file_name, original_name, file_size, content_type, upload_path, file_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userPayload.userId, uploadResult.fileName, file.name, file.size, file.type, uploadResult.pathname, uploadResult.url]
    );

    if (!insertResult.insertId) {
      throw new Error('Dosya veritabanına kaydedilemedi');
    }

    // Scanner output kaydı oluştur
    await executeUpdate(
      'INSERT INTO scanner_outputs (upload_id, user_id, status) VALUES (?, ?, ?)',
      [insertResult.insertId, userPayload.userId, 'pending']yükleme
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeUpdate, executeQuery } from '@/lib/database';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { uploadFile, extractFileMetadata } from '@/lib/storage';
import { ApiResponse, UploadResponse, UserRole } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Authentication kontrolü
    const userPayload = await getUserFromRequest(request);
    
    if (!userPayload) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Giriş yapmanız gerekiyor',
      }, { status: 401 });
    }

    // Permission kontrolü
    if (!hasPermission(userPayload.role, [UserRole.TEACHER, UserRole.ADMIN])) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Bu işlem için yetkiniz yok',
      }, { status: 403 });
    }

    // Form data'dan dosyayı al
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Dosya bulunamadı',
      }, { status: 400 });
    }

    // Dosya metadata'sını çıkar
    const metadata = extractFileMetadata(file);

    // Dosyayı Vercel Blob'a yükle
    const uploadResult = await uploadFile(file, userPayload.userId);

    // Veritabanına kaydet
    const insertResult = await executeUpdate(
      'INSERT INTO uploads (user_id, file_name, original_name, file_size, content_type, upload_path, file_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userPayload.userId, uploadResult.fileName, file.name, file.size, file.type, uploadResult.pathname, uploadResult.url]
    );

    if (!insertResult.insertId) {
      throw new Error('Dosya veritabanına kaydedilemedi');
    }

    // Scanner output kaydı oluştur
    await executeUpdate(
      'INSERT INTO scanner_outputs (upload_id, user_id, status) VALUES (?, ?, ?)',
      [insertResult.insertId, userPayload.userId, 'pending']
    );

    // Scanner webhook'una gönder
    try {
      const scannerWebhookUrl = process.env.SCANNER_WEBHOOK_URL;
      
      if (scannerWebhookUrl) {
        await fetch(scannerWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileId: insertResult.insertId,
            fileUrl: uploadResult.url,
            userId: userPayload.userId,
          }),
        });

        // Scanner output durumunu güncelle
        await executeUpdate(
          'UPDATE scanner_outputs SET status = ? WHERE upload_id = ?',
          ['processing', insertResult.insertId]
        );
      }
    } catch (webhookError) {
      console.error('Scanner webhook error:', webhookError);
      // Webhook hatası kritik değil, devam et
    }

    // Upload log'u
    try {
      await executeUpdate(
        'INSERT INTO system_logs (user_id, action, details) VALUES (?, ?, ?)',
        [
          userPayload.userId,
          'file_upload',
          JSON.stringify({
            fileId: insertResult.insertId,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
          })
        ]
      );
    } catch (logError) {
      console.error('Upload log error:', logError);
    }

    return NextResponse.json<ApiResponse<UploadResponse>>({
      success: true,
      data: {
        upload: {
          id: insertResult.insertId,
          user_id: userPayload.userId,
          file_name: uploadResult.fileName,
          original_name: file.name,
          file_size: file.size,
          content_type: file.type,
          upload_path: uploadResult.pathname,
          file_url: uploadResult.url,
          uploaded_at: uploadResult.uploadedAt,
        },
        message: 'Dosya başarıyla yüklendi ve analiz için gönderildi',
      },
      message: 'Dosya başarıyla yüklendi',
    });

  } catch (error) {
    console.error('Upload API error:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      message: error instanceof Error ? error.message : 'Dosya yükleme sırasında hata oluştu',
    }, { status: 500 });
  }
}

/**
 * Kullanıcının dosyalarını listele
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication kontrolü
    const userPayload = await getUserFromRequest(request);
    
    if (!userPayload) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Giriş yapmanız gerekiyor',
      }, { status: 401 });
    }

    // Query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const offset = (page - 1) * limit;

    // Base query
    let query = 'SELECT * FROM files WHERE user_id = ?';
    const params: any[] = [userPayload.userId];

    // Admin tüm dosyaları görebilir
    if (userPayload.role === UserRole.ADMIN) {
      query = 'SELECT * FROM files WHERE 1=1';
      params.shift(); // user_id parametresini kaldır
    }

    // Status filter
    if (status) {
      query += userPayload.role === UserRole.ADMIN ? ' AND status = ?' : ' AND status = ?';
      params.push(status);
    }

    // Pagination
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const files = await executeQuery(query, params);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        files,
        pagination: {
          page,
          limit,
          total: files.length, // Bu gerçek sayımda total count query'si gerekir
        },
      },
    });

  } catch (error) {
    console.error('Get files API error:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Dosyalar alınırken hata oluştu',
    }, { status: 500 });
  }
}
