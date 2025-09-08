/**
 * Admin - User Status Update API
 * Admin'ler kullanıcıları aktif/pasif yapabilir
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeUpdate, executeQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import { User, UserRole, ApiResponse } from '@/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // JWT token kontrolü
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Token gerekli',
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Geçersiz token',
      }, { status: 401 });
    }

    // Admin kontrolü
    if (payload.role !== UserRole.ADMIN) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Bu işlem için admin yetkisi gerekli',
      }, { status: 403 });
    }

    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Geçersiz kullanıcı ID',
      }, { status: 400 });
    }

    const { is_active } = await request.json();
    
    if (typeof is_active !== 'boolean') {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'is_active boolean değer olmalı',
      }, { status: 400 });
    }

    // Kullanıcı varlık kontrolü
    const users = await executeQuery<User>(
      'SELECT id, username, email FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Kullanıcı bulunamadı',
      }, { status: 404 });
    }

    // Kullanıcı durumunu güncelle
    const result = await executeUpdate(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [is_active ? 1 : 0, userId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Kullanıcı durumu güncellenemedi',
      }, { status: 500 });
    }

    // Log kaydı
    try {
      await executeUpdate(
        'INSERT INTO system_logs (user_id, action, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
        [
          payload.userId,
          'user_status_update',
          JSON.stringify({ 
            target_user_id: userId, 
            new_status: is_active ? 'active' : 'inactive' 
          }),
          request.headers.get('x-forwarded-for') || 'unknown',
          request.headers.get('user-agent') || null
        ]
      );
    } catch (logError) {
      console.error('Log error:', logError);
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `Kullanıcı ${is_active ? 'aktif' : 'pasif'} yapıldı`,
      data: {
        user_id: userId,
        username: users[0].username,
        is_active
      }
    });

  } catch (error) {
    console.error('User status update error:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Sunucu hatası',
    }, { status: 500 });
  }
}
