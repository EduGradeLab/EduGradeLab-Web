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
      fileId, 
      analysisId, 
      status, 
      score, 
      feedback, 
      visualAnalysis, 
      pdfUrl, 
      error 
    } = payload;

    // Basic validation
    if (!fileId || !status) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'fileId ve status gereklidir',
      }, { status: 400 });
    }

    if (status === 'success') {
      // Başarılı analiz
      await executeUpdate(
        'UPDATE files SET status = ? WHERE id = ?',
        [FileStatus.COMPLETED, fileId]
      );

      // Analysis results'ı güncelle
      await executeUpdate(
        `UPDATE analysis_results SET 
         status = ?, score = ?, feedback = ?, visual_analysis = ?, pdf_url = ?, updated_at = CURRENT_TIMESTAMP
         WHERE file_id = ?`,
        [
          AnalysisStatus.COMPLETED,
          score || null,
          feedback || null,
          visualAnalysis ? JSON.stringify(visualAnalysis) : null,
          pdfUrl || null,
          fileId
        ]
      );

      console.log(`✅ Analiz tamamlandı - File ID: ${fileId}, Score: ${score}`);

    } else {
      // Analiz hatası
      await executeUpdate(
        'UPDATE files SET status = ? WHERE id = ?',
        [FileStatus.ERROR, fileId]
      );

      await executeUpdate(
        `UPDATE analysis_results SET 
         status = ?, feedback = ?, updated_at = CURRENT_TIMESTAMP
         WHERE file_id = ?`,
        [
          AnalysisStatus.ERROR,
          error || 'AI analiz hatası',
          fileId
        ]
      );

      console.error(`❌ Analiz hatası - File ID: ${fileId}, Error: ${error}`);
    }

    // Log işlemi
    try {
      await executeUpdate(
        'INSERT INTO system_logs (action, details) VALUES (?, ?)',
        [
          'ai_analysis_webhook',
          JSON.stringify({
            fileId,
            analysisId,
            status,
            score,
            hasFeedback: !!feedback,
            hasVisualAnalysis: !!visualAnalysis,
            hasPdfUrl: !!pdfUrl,
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
        fileId,
        status,
        score: status === 'success' ? score : undefined,
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
