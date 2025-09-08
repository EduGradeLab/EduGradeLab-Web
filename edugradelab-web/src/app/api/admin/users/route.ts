/**
 * Admin - Users List API
 * Admin'ler tüm kullanıcıları görebilir
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import { User, UserRole, ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
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

    // Query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // 'active', 'inactive', or null for all

    const offset = (page - 1) * limit;

    // Build query conditions
    let whereConditions = '';
    const queryParams: (string | number)[] = [];

    if (search) {
      whereConditions += 'WHERE (username LIKE ? OR email LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      const statusValue = status === 'active' ? 1 : 0;
      if (whereConditions) {
        whereConditions += ` AND is_active = ?`;
      } else {
        whereConditions += `WHERE is_active = ?`;
      }
      queryParams.push(statusValue);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereConditions}`;
    const countResult = await executeQuery<{ total: number }>(countQuery, queryParams);
    const total = countResult[0]?.total || 0;

    // Get users (without password_hash)
    const usersQuery = `
      SELECT id, username, email, role, is_active, created_at 
      FROM users 
      ${whereConditions}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    const users = await executeQuery<User>(
      usersQuery, 
      [...queryParams, limit, offset]
    );

    return NextResponse.json<ApiResponse<{
      users: User[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      }
    }>>({
      success: true,
      message: 'Kullanıcılar başarıyla listelendi',
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Users list error:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      message: 'Sunucu hatası',
    }, { status: 500 });
  }
}
