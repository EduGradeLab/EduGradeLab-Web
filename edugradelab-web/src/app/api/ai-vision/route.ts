/**
 * AI Vision API Route
 * Sınav kağıdı görsel analizi için
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { ApiResponse, UserRole } from '@/types';

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

    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Görsel dosyası bulunamadı',
      }, { status: 400 });
    }

    // Görsel dosyasını base64'e çevir
    const imageBuffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    // AI Vision Analysis burada yapılacak
    // Şu an için mock response döndürüyoruz
    console.log('AI Vision analyzing image:', base64Image.substring(0, 50) + '...');
    
    const mockAnalysisResult = {
      ogrenci: {
        ad: "[OKUNAMIYOR]",
        soyad: "[OKUNAMIYOR]",
        numara: "[OKUNAMIYOR]", 
        sinif: "[OKUNAMIYOR]"
      },
      sinav: {
        baslik: "[OKUNAMIYOR]",
        sorular: [
          {
            soru_numarasi: 1,
            soru_tipi: "multiple_choice",
            soru_metni: "[OKUNAMIYOR]",
            siklar: {"A":"[OKUNAMIYOR]", "B":"[OKUNAMIYOR]", "C":"[OKUNAMIYOR]", "D":"[OKUNAMIYOR]"},
            isaretli_cevap: "[BOŞ]",
            puan: null
          }
        ]
      }
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      data: mockAnalysisResult,
      message: 'Görsel analizi tamamlandı',
    });

  } catch (error) {
    console.error('AI Vision API error:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Görsel analizi sırasında hata oluştu',
    }, { status: 500 });
  }
}
