/**
 * Register API Route
 * Yeni kullanıcı kaydı
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, createToken } from '@/lib/auth';
import { validateEmail, validatePasswordStrong, RateLimiter } from '@/lib/auth-client';
import { UserProfile, RegisterFormData, ApiResponse, LoginResponse, UserRole } from '@/types';

// Rate limiting
const registerLimiter = new RateLimiter(3, 60 * 60 * 1000); // 3 attempts per hour

export async function POST(request: NextRequest) {
  try {
    console.log('=== REGISTER API START ===');
    
    // Rate limiting kontrolü
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    if (!registerLimiter.isAllowed(clientIp)) {
      console.log('Rate limit exceeded for IP:', clientIp);
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Çok fazla kayıt denemesi. 1 saat sonra tekrar deneyin.',
      }, { status: 429 });
    }

    // Request body'yi parse et
    let body: RegisterFormData;
    try {
      body = await request.json();
      console.log('Request body parsed successfully');
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Geçersiz veri formatı',
      }, { status: 400 });
    }
    
    // DEBUG: Request body'yi log'la
    console.log('=== REGISTER DEBUG ===');
    console.log('Request body:', JSON.stringify(body, null, 2));
    console.log('Body keys:', Object.keys(body || {}));
    
    const { username, email, password, confirmPassword } = body;

    // DETAILED DEBUG: Her field'ı ayrı ayrı kontrol et
    console.log('=== DETAILED FIELD DEBUG ===');
    console.log('username raw:', username, 'type:', typeof username);
    console.log('username trimmed:', username?.trim(), 'length:', username?.trim()?.length);
    console.log('email:', email, 'type:', typeof email);
    console.log('password:', password, 'type:', typeof password, 'length:', password?.length);
    console.log('confirmPassword:', confirmPassword, 'type:', typeof confirmPassword, 'length:', confirmPassword?.length);
    
    console.log('=== VALIDATION CHECKS ===');
    console.log('!username?.trim():', !username?.trim());
    console.log('!email:', !email);
    console.log('!password:', !password);
    console.log('!confirmPassword:', !confirmPassword);

    // Basic validation
    if (!username?.trim() || !email || !password || !confirmPassword) {
      console.log('VALIDATION FAILED - Missing fields detected');
      console.log('Validation failed:', {
        username: !!username?.trim(),
        email: !!email,
        password: !!password,
        confirmPassword: !!confirmPassword
      });
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Tüm alanları doldurunuz',
      }, { status: 400 });
    }

    console.log('Basic validation PASSED - All fields present');

    console.log('=== EMAIL VALIDATION ===');
    console.log('Email to validate:', email);
    if (!validateEmail(email)) {
      console.log('EMAIL VALIDATION FAILED');
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Geçerli bir e-posta adresi giriniz',
      }, { status: 400 });
    }
    console.log('Email validation PASSED');

    console.log('=== PASSWORD MATCH CHECK ===');
    console.log('password:', password);
    console.log('confirmPassword:', confirmPassword);
    console.log('Match result:', password === confirmPassword);
    if (password !== confirmPassword) {
      console.log('PASSWORD MATCH FAILED');
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Şifreler eşleşmiyor',
      }, { status: 400 });
    }
    console.log('Password match PASSED');

    console.log('=== PASSWORD STRENGTH CHECK ===');
    // Şifre güvenlik kontrolü
    const passwordValidation = validatePasswordStrong(password);
    console.log('Password validation result:', passwordValidation);
    if (!passwordValidation.isValid) {
      console.log('PASSWORD STRENGTH FAILED:', passwordValidation.errors);
      return NextResponse.json<ApiResponse>({
        success: false,
        message: passwordValidation.errors[0],
      }, { status: 400 });
    }
    console.log('Password strength PASSED');

    console.log('=== DATABASE OPERATIONS ===');
    // E-posta benzersizlik kontrolü
    console.log('Checking if email exists:', email.toLowerCase());
    let existingUser;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });
    } catch (dbError) {
      console.error('Database check error:', dbError);
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Veritabanı bağlantı hatası',
      }, { status: 500 });
    }

    if (existingUser) {
      console.log('User already exists with email:', email);
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Bu e-posta adresi zaten kullanımda',
      }, { status: 409 });
    }
    console.log('Email is available');

    // Şifreyi hash'le
    console.log('Hashing password...');
    let passwordHash;
    try {
      passwordHash = await hashPassword(password);
      console.log('Password hashed successfully');
    } catch (hashError) {
      console.error('Password hashing error:', hashError);
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Şifre işleme hatası',
      }, { status: 500 });
    }

    // Kullanıcıyı oluştur - is_active default olarak true
    console.log('Creating new user...');
    let newUser;
    try {
      newUser = await prisma.user.create({
        data: {
          first_name: username.trim().split(' ')[0] || username.trim(),
          last_name: username.trim().split(' ').slice(1).join(' ') || '',
          email: email.toLowerCase(),
          password_hash: passwordHash,
          role: 'TEACHER',
          is_active: true,
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          role: true,
          is_active: true,
          created_at: true,
        }
      });
      console.log('User created successfully with ID:', newUser.id);
    } catch (createError) {
      console.error('User creation error:', createError);
      if (createError instanceof Error && createError.message.includes('Duplicate entry')) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: 'Bu e-posta adresi zaten kullanımda',
        }, { status: 409 });
      }
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Kullanıcı oluşturma hatası',
      }, { status: 500 });
    }

    console.log('=== USER PROFILE & TOKEN CREATION ===');
    // UserProfile objesi oluştur (şifre olmadan)
    const userProfile: UserProfile = {
      id: newUser.id,
      email: newUser.email,
      username: `${newUser.first_name} ${newUser.last_name}`.trim(),
      role: newUser.role as UserRole,
      is_active: newUser.is_active,
      created_at: newUser.created_at,
    };
    console.log('User profile created:', { id: userProfile.id, email: userProfile.email });

    // Rate limiting'i reset et (başarılı kayıt)
    registerLimiter.reset(clientIp);
    console.log('Rate limiter reset for IP:', clientIp);

    // JWT token oluştur
    console.log('Creating JWT token...');
    let token;
    try {
      token = createToken({
        userId: userProfile.id,
        email: userProfile.email,
        username: userProfile.username,
        role: userProfile.role,
      });
      console.log('JWT token created successfully');
    } catch (tokenError) {
      console.error('Token creation error:', tokenError);
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Token oluşturma hatası',
      }, { status: 500 });
    }

    console.log('=== REGISTER SUCCESS ===');
    return NextResponse.json<ApiResponse<LoginResponse>>({
      success: true,
      data: {
        user: userProfile,
        token,
      },
      message: 'Hesap başarıyla oluşturuldu',
    }, { status: 201 });
    
  } catch (error) {
    console.error('=== REGISTER API ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Özel hata tiplerini kontrol et
    if (error instanceof Error) {
      if (error.message.includes('Duplicate entry')) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: 'Bu e-posta adresi zaten kullanımda',
        }, { status: 409 });
      }
      
      if (error.message.includes('validation')) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: 'Veri doğrulama hatası: ' + error.message,
        }, { status: 400 });
      }
    }
    
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Sunucu hatası. Lütfen tekrar deneyin.',
    }, { status: 500 });
  }
}
