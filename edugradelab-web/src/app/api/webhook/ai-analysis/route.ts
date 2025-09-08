/**
 * AI Analysis Webhook API Route
 * AI analiz sonuçlarını alır
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeUpdate } from '@/lib/database';
import { ApiResponse, AIAnalysisWebhookPayload, FileStatus, AnalysisStatus } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Webhook payload'ını parse et
    const payload: AIAnalysisWebhookPayload = await request.json();
    const { 
      uploadId, 
      analysisId, 
      status, 
      analysisData, 
      error 
    } = payload;

    // Basic validation
    if (!uploadId || !status) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'uploadId ve status gereklidir',
      }, { status: 400 });
    }

    if (status === 'success' && analysisData) {
      // Başarılı analiz
      await executeUpdate(
        'UPDATE uploads SET status = ? WHERE id = ?',
        [FileStatus.COMPLETED, uploadId]
      );

      // Analysis tablosuna kaydet
      await executeUpdate(
        `INSERT INTO analysis (upload_id, user_id, analysis_data, created_at) 
         VALUES (?, (SELECT user_id FROM uploads WHERE id = ?), ?, CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE 
         analysis_data = VALUES(analysis_data), updated_at = CURRENT_TIMESTAMP`,
        [
          uploadId,
          uploadId,
          JSON.stringify(analysisData)
        ]
      );

      console.log(`✅ Analiz tamamlandı - Upload ID: ${uploadId}`);

    } else {
      // Analiz hatası
      await executeUpdate(
        'UPDATE uploads SET status = ? WHERE id = ?',
        [FileStatus.ERROR, uploadId]
      );

      // Hata kaydı
      await executeUpdate(
        `INSERT INTO analysis (upload_id, user_id, error_message, created_at) 
         VALUES (?, (SELECT user_id FROM uploads WHERE id = ?), ?, CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE 
         error_message = VALUES(error_message), updated_at = CURRENT_TIMESTAMP`,
        [
          uploadId,
          uploadId,
          error || 'AI analiz hatası'
        ]
      );

      console.error(`❌ Analiz hatası - Upload ID: ${uploadId}, Error: ${error}`);
    }

    // Log işlemi
    try {
      await executeUpdate(
        'INSERT INTO system_logs (action, details) VALUES (?, ?)',
        [
          'ai_analysis_webhook',
          JSON.stringify({
            uploadId,
            analysisId,
            status,
            hasAnalysisData: !!analysisData,
            error,
          })
        ]
      );
    } catch (logError) {
      console.error('AI analysis webhook log error:', logError);
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'AI analysis webhook işlendi',
      data: {
        uploadId,
        status,
        hasAnalysisData: status === 'success' && !!analysisData,
      },
    });

  } catch (error) {
    console.error('AI analysis webhook error:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Webhook işleme hatası',
    }, { status: 500 });
  }
}
