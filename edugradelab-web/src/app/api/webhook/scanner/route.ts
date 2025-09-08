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
    const { uploadId, status, scannedImageUrl, meta, error } = payload;

    // Basic validation
    if (!uploadId || !status) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'uploadId ve status gereklidir',
      }, { status: 400 });
    }

    if (status === 'success') {
      // Başarılı tarama
      await executeUpdate(
        'UPDATE uploads SET status = ? WHERE id = ?',
        [FileStatus.SCANNED, uploadId]
      );

      // Meta bilgileri varsa güncelle
      if (meta) {
        await executeUpdate(
          'UPDATE uploads SET metadata = ? WHERE id = ?',
          [JSON.stringify(meta), uploadId]
        );
      }

      // Scanned image URL'i varsa güncelle
      if (scannedImageUrl) {
        await executeUpdate(
          'UPDATE uploads SET processed_url = ? WHERE id = ?',
          [scannedImageUrl, uploadId]
        );
      }

      console.log(`✅ Tarama tamamlandı - Upload ID: ${uploadId}`);

    } else {
      // Tarama hatası
      await executeUpdate(
        'UPDATE uploads SET status = ? WHERE id = ?',
        [FileStatus.ERROR, uploadId]
      );

      console.error(`❌ Tarama hatası - Upload ID: ${uploadId}, Error: ${error}`);
    }

    // Log işlemi
    try {
      await executeUpdate(
        'INSERT INTO system_logs (action, details) VALUES (?, ?)',
        [
          'scanner_webhook',
          JSON.stringify({
            uploadId,
            status,
            hasScannedImage: !!scannedImageUrl,
            hasMeta: !!meta,
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
      data: {
        uploadId,
        status,
      },
    });

  } catch (error) {
    console.error('Scanner webhook error:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Webhook işleme hatası',
    }, { status: 500 });
  }
}
