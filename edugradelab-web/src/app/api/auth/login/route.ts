/**
 * Login API Route
 * JWT ile kullanıcı girişi
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, createToken } from '@/lib/auth';
import { validateEmail, RateLimiter } from '@/lib/auth-client';
import { UserProfile, LoginFormData, ApiResponse, LoginResponse, UserRole } from '@/types';

// Rate limiting
const loginLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes

export async function POST(request: NextRequest) {
  try {
    // Rate limiting kontrolü
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    if (!loginLimiter.isAllowed(clientIp)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.',
      }, { status: 429 });
    }

    // Request body'yi parse et
    const body: LoginFormData = await request.json();
    const { email, password } = body;

    // Basic validation
    if (!email || !password) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'E-posta ve şifre gereklidir',
      }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Geçerli bir e-posta adresi giriniz',
      }, { status: 400 });
    }

    // Kullanıcı varlığı ve aktiflik kontrolü
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        is_active: true,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        password_hash: true,
        is_active: true,
        created_at: true,
      }
    });

    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'E-posta veya şifre hatalı veya hesap pasif',
      }, { status: 401 });
    }

    // Şifre doğrulama
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    console.log('Password verification for user:', `${user.first_name} ${user.last_name}`, isPasswordValid ? 'success' : 'failed');    if (!isPasswordValid) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'E-posta veya şifre hatalı',
      }, { status: 401 });
    }

    // Rate limiting'i reset et (başarılı giriş)
    loginLimiter.reset(clientIp);

    // JWT token oluştur
    const username = `${user.first_name} ${user.last_name}`.trim();
    const token = createToken({
      userId: user.id,
      email: user.email,
      username: username,
      role: user.role as UserRole,
    });

    // User object'i temizle (password_hash'i çıkar)
    const userProfile: UserProfile = {
      id: user.id,
      email: user.email,
      username: username,
      role: user.role as UserRole,
      is_active: user.is_active,
      created_at: user.created_at,
    };

    return NextResponse.json<ApiResponse<LoginResponse>>({
      success: true,
      data: {
        user: userProfile,
        token,
      },
      message: 'Giriş başarılı',
    });

  } catch (error) {
    console.error('Login API error:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Sunucu hatası',
    }, { status: 500 });
  }
}
