/**
 * Webhook API Route
 * Scanner ve harici servislerden gelen webhook'ları işle
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeUpdate, executeQuery } from '@/lib/database';
import { ApiResponse } from '@/types';

/**
 * Scanner'dan gelen sonuçları işle
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uploadId, status, scannerData, analysisData } = body;

    if (!uploadId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Upload ID gereklidir',
      }, { status: 400 });
    }

    // Upload'ın var olduğunu kontrol et
    const uploads = await executeQuery(
      'SELECT id, user_id FROM uploads WHERE id = ?',
      [uploadId]
    );

    if (uploads.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Upload bulunamadı',
      }, { status: 404 });
    }

    const upload = uploads[0] as { id: number; user_id: number };

    // Scanner output'u güncelle
    if (scannerData) {
      await executeUpdate(
        'UPDATE scanner_outputs SET status = ?, scanned_text = ?, questions_detected = ?, answers_detected = ?, scanned_at = CURRENT_TIMESTAMP WHERE upload_id = ?',
        [status || 'completed', scannerData.scannedText || null, scannerData.questionsDetected || 0, scannerData.answersDetected || 0, uploadId]
      );
    }

    // Analiz sonuçlarını güncelle
    if (analysisData) {
      const existingAnalysis = await executeQuery(
        'SELECT id FROM analysis WHERE upload_id = ?',
        [uploadId]
      );

      if (existingAnalysis.length > 0) {
        // Mevcut analizi güncelle
        await executeUpdate(
          'UPDATE analysis SET status = ?, total_questions = ?, correct_answers = ?, wrong_answers = ?, blank_answers = ?, score = ?, result_data = ?, updated_at = CURRENT_TIMESTAMP WHERE upload_id = ?',
          [
            analysisData.status || 'completed',
            analysisData.totalQuestions || 0,
            analysisData.correctAnswers || 0,
            analysisData.wrongAnswers || 0,
            analysisData.blankAnswers || 0,
            analysisData.score || 0,
            JSON.stringify(analysisData.resultData || {}),
            uploadId
          ]
        );
      } else {
        // Yeni analiz kaydı oluştur
        await executeUpdate(
          'INSERT INTO analysis (upload_id, user_id, status, total_questions, correct_answers, wrong_answers, blank_answers, score, result_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            uploadId,
            upload.user_id,
            analysisData.status || 'completed',
            analysisData.totalQuestions || 0,
            analysisData.correctAnswers || 0,
            analysisData.wrongAnswers || 0,
            analysisData.blankAnswers || 0,
            analysisData.score || 0,
            JSON.stringify(analysisData.resultData || {})
          ]
        );
      }
    }

    // Webhook log'u
    try {
      await executeUpdate(
        'INSERT INTO system_logs (user_id, action, details) VALUES (?, ?, ?)',
        [
          upload.user_id,
          'webhook_received',
          JSON.stringify({
            uploadId,
            status,
            hasScanner: !!scannerData,
            hasAnalysis: !!analysisData,
          })
        ]
      );
    } catch (logError) {
      console.error('Webhook log error:', logError);
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Webhook başarıyla işlendi',
    });

  } catch (error) {
    console.error('Webhook API error:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Sunucu hatası',
    }, { status: 500 });
  }
}
