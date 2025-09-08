/**
 * Login API Route
 * JWT ile kullanıcı girişi
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { verifyPassword, createToken, validateEmail, RateLimiter } from '@/lib/auth';
import { User, LoginFormData, ApiResponse, LoginResponse } from '@/types';

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

    // Kullanıcıyı veritabanından bul
    const users = await executeQuery<User & { password_hash: string }>(
      'SELECT id, email, username, role, password_hash, created_at FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'E-posta veya şifre hatalı',
      }, { status: 401 });
    }

    const user = users[0];

    // Şifreyi doğrula
    const isPasswordValid = await verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'E-posta veya şifre hatalı',
      }, { status: 401 });
    }

    // Rate limiting'i reset et (başarılı giriş)
    loginLimiter.reset(clientIp);

    // JWT token oluştur
    const token = createToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    // User object'i temizle (password_hash'i çıkar)
    const { password_hash, ...userWithoutPassword } = user;

    // Login log'u (opsiyonel)
    try {
      await executeQuery(
        'INSERT INTO system_logs (user_id, action, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
        [
          user.id,
          'login',
          JSON.stringify({ method: 'email' }),
          clientIp,
          request.headers.get('user-agent') || null
        ]
      );
    } catch (logError) {
      // Log hatası kritik değil, devam et
      console.error('Login log error:', logError);
    }

    return NextResponse.json<ApiResponse<LoginResponse>>({
      success: true,
      data: {
        user: userWithoutPassword,
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
