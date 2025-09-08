/**
 * Analysis API Route
 * Polling ile analiz sonuçlarını getir
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getUserFromRequest, isOwnerOrAdmin } from '@/lib/auth';
import { ApiResponse, Analysis } from '@/types';

/**
 * Analiz sonuçlarını getir (polling için)
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
    const uploadId = searchParams.get('uploadId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Specific upload analizi iste
    if (uploadId) {
      const uploadIdNum = parseInt(uploadId);
      
      if (isNaN(uploadIdNum)) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: 'Geçersiz upload ID',
        }, { status: 400 });
      }

      // Upload'ın sahibi mi kontrol et
      const uploads = await executeQuery(
        'SELECT user_id FROM uploads WHERE id = ?',
        [uploadIdNum]
      );

      if (uploads.length === 0) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: 'Upload bulunamadı',
        }, { status: 404 });
      }

      const upload = uploads[0] as { user_id: number };

      if (!isOwnerOrAdmin(userPayload.role, userPayload.userId, upload.user_id)) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: 'Bu analize erişim yetkiniz yok',
        }, { status: 403 });
      }

      const analyses = await executeQuery<Analysis>(
        `SELECT a.*, u.original_name, u.file_url 
         FROM analysis a 
         JOIN uploads u ON a.upload_id = u.id 
         WHERE a.upload_id = ?`,
        [uploadIdNum]
      );

      if (analyses.length === 0) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: 'Analiz bulunamadı',
        }, { status: 404 });
      }

      return NextResponse.json<ApiResponse<Analysis>>({
        success: true,
        data: analyses[0],
        message: 'Analiz başarıyla getirildi',
      });
    }

    // Tüm analizleri getir
    let analysisQuery = '';
    let analysisParams: unknown[] = [];

    if (userPayload.role === 'admin') {
      analysisQuery = `
        SELECT a.*, u.original_name, u.file_url, users.username 
        FROM analysis a 
        JOIN uploads u ON a.upload_id = u.id 
        JOIN users ON a.user_id = users.id 
        ORDER BY a.created_at DESC 
        LIMIT ? OFFSET ?`;
      analysisParams = [limit, offset];
    } else {
      analysisQuery = `
        SELECT a.*, u.original_name, u.file_url 
        FROM analysis a 
        JOIN uploads u ON a.upload_id = u.id 
        WHERE a.user_id = ? 
        ORDER BY a.created_at DESC 
        LIMIT ? OFFSET ?`;
      analysisParams = [userPayload.userId, limit, offset];
    }

    const analyses = await executeQuery<Analysis & {
      username?: string;
      original_name: string;
      file_url: string;
    }>(analysisQuery, analysisParams);

    // Toplam kayıt sayısını al
    let countQuery = 'SELECT COUNT(*) as total FROM analysis WHERE user_id = ?';
    let countParams = [userPayload.userId];

    if (userPayload.role === 'admin') {
      countQuery = 'SELECT COUNT(*) as total FROM analysis';
      countParams = [];
    }

    const countResult = await executeQuery<{ total: number }>(countQuery, countParams);
    const totalCount = countResult[0].total;

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        analyses,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      },
      message: 'Analizler başarıyla getirildi',
    });

  } catch (error) {
    console.error('Analysis API error:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Sunucu hatası',
    }, { status: 500 });
  }
}
