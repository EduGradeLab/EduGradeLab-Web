/**
 * Register API Route
 * Yeni kullanıcı kaydı
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeUpdate } from '@/lib/database';
import { hashPassword, createToken, validateEmail, validatePassword, RateLimiter } from '@/lib/auth';
import { User, RegisterFormData, ApiResponse, LoginResponse, UserRole } from '@/types';

// Rate limiting
const registerLimiter = new RateLimiter(3, 60 * 60 * 1000); // 3 attempts per hour

export async function POST(request: NextRequest) {
  try {
    // Rate limiting kontrolü
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    if (!registerLimiter.isAllowed(clientIp)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Çok fazla kayıt denemesi. 1 saat sonra tekrar deneyin.',
      }, { status: 429 });
    }

    // Request body'yi parse et
    const body: RegisterFormData = await request.json();
    const { username, email, password, confirmPassword } = body;

    // Basic validation
    if (!username?.trim() || !email || !password || !confirmPassword) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Tüm alanları doldurunuz',
      }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Geçerli bir e-posta adresi giriniz',
      }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Şifreler eşleşmiyor',
      }, { status: 400 });
    }

    // Şifre güvenlik kontrolü
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: passwordValidation.errors[0],
      }, { status: 400 });
    }

    // E-posta benzersizlik kontrolü
    const existingUsers = await executeQuery<User>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Bu e-posta adresi zaten kullanımda',
      }, { status: 409 });
    }

    // Şifreyi hash'le
    const passwordHash = await hashPassword(password);

    // Kullanıcıyı oluştur
    const result = await executeUpdate(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username.trim(), email.toLowerCase(), passwordHash, UserRole.TEACHER]
    );

    if (!result.insertId) {
      throw new Error('Kullanıcı oluşturulamadı');
    }

    // Yeni kullanıcı bilgilerini al
    const newUsers = await executeQuery<User>(
      'SELECT id, email, username, role, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    if (newUsers.length === 0) {
      throw new Error('Kullanıcı bilgileri alınamadı');
    }

    const newUser = newUsers[0];

    // Rate limiting'i reset et (başarılı kayıt)
    registerLimiter.reset(clientIp);

    // JWT token oluştur
    const token = createToken({
      userId: newUser.id,
      email: newUser.email,
      username: newUser.username,
      role: newUser.role,
    });

    // Register log'u (opsiyonel)
    try {
      await executeQuery(
        'INSERT INTO system_logs (user_id, action, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
        [
          newUser.id,
          'register',
          JSON.stringify({ method: 'email' }),
          clientIp,
          request.headers.get('user-agent') || null
        ]
      );
    } catch (logError) {
      // Log hatası kritik değil, devam et
      console.error('Register log error:', logError);
    }

    return NextResponse.json<ApiResponse<LoginResponse>>({
      success: true,
      data: {
        user: newUser,
        token,
      },
      message: 'Hesap başarıyla oluşturuldu',
    }, { status: 201 });

  } catch (error) {
    console.error('Register API error:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Sunucu hatası',
    }, { status: 500 });
  }
}
