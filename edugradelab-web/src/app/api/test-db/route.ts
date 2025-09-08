/**
 * Database Connection Test API
 * Sadece test amaçlı - production'da kaldırılacak
 */

import { NextResponse } from 'next/server';
import { testConnection, executeQuery } from '@/lib/database';

export async function GET() {
  try {
    // Database bağlantısını test et
    const isConnected = await testConnection();
    
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        message: 'Database bağlantısı başarısız',
      }, { status: 500 });
    }

    // Basit bir query dene
    const result = await executeQuery('SELECT 1 as test');
    
    return NextResponse.json({
      success: true,
      message: 'Database bağlantısı başarılı',
      data: {
        connected: true,
        testQuery: result,
      },
    });

  } catch (error) {
    console.error('Database test error:', error);
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Bilinmeyen hata',
    }, { status: 500 });
  }
}
