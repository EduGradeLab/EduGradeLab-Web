/**
 * Simple Register API Test
 * Sadece test amaçlı - production'da kaldırılacak
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('=== REGISTER API TEST BAŞLADI ===');
  
  try {
    // Request body'yi parse et
    console.log('Body parsing...');
    const body = await request.json();
    console.log('Body parsed:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Test başarılı',
      data: body,
    });
    
  } catch (error) {
    console.error('Register API test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Test hatası: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'),
    }, { status: 500 });
  }
}
