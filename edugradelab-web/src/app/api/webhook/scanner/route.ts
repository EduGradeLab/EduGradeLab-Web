/**
 * Scanner Webhook API Route
 * Dosya tarama sonuçlarını alır
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeUpdate } from '@/lib/database';
import { ApiResponse, ScannerWebhookPayload, FileStatus } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Webhook payload'ını parse et
    const payload: ScannerWebhookPayload = await request.json();
    const { fileId, status, scannedText, confidence, error } = payload;

    // Basic validation
    if (!fileId || !status) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'fileId ve status gereklidir',
      }, { status: 400 });
    }

    if (status === 'success') {
      // Başarılı tarama
      await executeUpdate(
        'UPDATE files SET status = ? WHERE id = ?',
        [FileStatus.SCANNED, fileId]
      );

      // AI analizi için webhook'u tetikle
      try {
        const aiWebhookUrl = process.env.AI_ANALYSIS_WEBHOOK_URL;
        
        if (aiWebhookUrl) {
          await fetch(aiWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileId,
              scannedText,
              confidence,
            }),
          });

          // Dosya durumunu güncelle
          await executeUpdate(
            'UPDATE files SET status = ? WHERE id = ?',
            [FileStatus.ANALYZING, fileId]
          );

          // Analysis results tablosunu güncelle
          await executeUpdate(
            'UPDATE analysis_results SET status = ? WHERE file_id = ?',
            ['in_progress', fileId]
          );
        }
      } catch (aiError) {
        console.error('AI webhook error:', aiError);
        
        // AI webhook hatası durumunda
        await executeUpdate(
          'UPDATE files SET status = ? WHERE id = ?',
          [FileStatus.ERROR, fileId]
        );

        await executeUpdate(
          'UPDATE analysis_results SET status = ?, feedback = ? WHERE file_id = ?',
          ['error', 'AI analizi başlatılamadı', fileId]
        );
      }

    } else {
      // Tarama hatası
      await executeUpdate(
        'UPDATE files SET status = ? WHERE id = ?',
        [FileStatus.ERROR, fileId]
      );

      await executeUpdate(
        'UPDATE analysis_results SET status = ?, feedback = ? WHERE file_id = ?',
        ['error', error || 'Dosya tarama hatası', fileId]
      );
    }

    // Log işlemi
    try {
      await executeUpdate(
        'INSERT INTO system_logs (action, details) VALUES (?, ?)',
        [
          'scanner_webhook',
          JSON.stringify({
            fileId,
            status,
            scannedText: scannedText ? 'received' : null,
            confidence,
            error,
          })
        ]
      );
    } catch (logError) {
      console.error('Scanner webhook log error:', logError);
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Scanner webhook işlendi',
    });

  } catch (error) {
    console.error('Scanner webhook error:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Webhook işleme hatası',
    }, { status: 500 });
  }
}
