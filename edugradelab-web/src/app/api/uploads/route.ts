import { NextRequest, NextResponse } from 'next/server';
import { executeUpdate, executeQuery } from '@/lib/database';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { uploadFile } from '@/lib/storage';
import { ApiResponse, UploadResponse, UserRole } from '@/types';

enum FileStatus {
  UPLOADED = 'uploaded',
  SCANNING = 'scanning',
  SCANNED = 'scanned',
  ANALYZING = 'analyzing',
  COMPLETED = 'completed',
  ERROR = 'error'
}

export async function POST(request: NextRequest) {
  try {
    const userPayload = await getUserFromRequest(request);
    
    if (!userPayload) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Giriş yapmanız gerekiyor',
      }, { status: 401 });
    }

    if (!hasPermission(userPayload.role, [UserRole.TEACHER, UserRole.ADMIN])) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Bu işlem için yetkiniz bulunmuyor',
      }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Dosya bulunamadı',
      }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Dosya boyutu 10MB den büyük olamaz',
      }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Desteklenmeyen dosya türü',
      }, { status: 400 });
    }

    const uploadResult = await uploadFile(file, userPayload.userId);

    const insertResult = await executeUpdate(
      'INSERT INTO uploads (user_id, file_name, original_name, file_size, content_type, upload_path, file_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userPayload.userId, uploadResult.fileName, file.name, file.size, file.type, uploadResult.pathname, uploadResult.url, FileStatus.UPLOADED]
    );

    if (!insertResult.insertId) {
      throw new Error('Dosya veritabanına kaydedilemedi');
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
          status: FileStatus.UPLOADED,
          uploaded_at: uploadResult.uploadedAt,
        },
        message: 'Dosya başarıyla yüklendi',
      },
      message: 'Dosya başarıyla yüklendi',
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Dosya yükleme hatası',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userPayload = await getUserFromRequest(request);
    
    if (!userPayload) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Giriş yapmanız gerekiyor',
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    let query = '';
    let params: unknown[] = [];

    if (userPayload.role === UserRole.ADMIN) {
      query = 'SELECT u.*, users.username FROM uploads u JOIN users ON u.user_id = users.id ORDER BY u.uploaded_at DESC LIMIT ? OFFSET ?';
      params = [limit, offset];
    } else {
      query = 'SELECT * FROM uploads WHERE user_id = ? ORDER BY uploaded_at DESC LIMIT ? OFFSET ?';
      params = [userPayload.userId, limit, offset];
    }

    const files = await executeQuery(query, params);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        files,
        pagination: {
          page,
          limit,
          total: files.length,
        },
      },
      message: 'Dosyalar başarıyla getirildi',
    });

  } catch (error) {
    console.error('Files fetch error:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Dosyalar getirilirken hata oluştu',
    }, { status: 500 });
  }
}
