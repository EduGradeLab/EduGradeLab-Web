/**
 * Server-side JWT token ve authentication yardımcı fonksiyonları
 * Sadece API routes'larda kullanılmalı
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWTPayload, UserRole } from '@/types';

const JWT_EXPIRES_IN = '7d';

/**
 * JWT Secret'i güvenli şekilde al
 */
function getJWTSecret(): string {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return JWT_SECRET;
}

/**
 * Şifreyi güvenli şekilde hash'ler
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Şifreyi doğrular
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * JWT token oluşturur (Server-side only)
 */
export function createToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const JWT_SECRET = getJWTSecret();
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'edugradelab',
    audience: 'edugradelab-users'
  });
}

/**
 * JWT token doğrular (Server-side only)
 */
export function verifyToken(token: string): JWTPayload {
  const JWT_SECRET = getJWTSecret();
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    throw new Error('Invalid or expired token');
  }
}

/**
 * Authorization header'dan token'ı çıkarır
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  // "Bearer TOKEN" formatını kontrol et
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * Request'ten user bilgilerini çıkarır
 */
export async function getUserFromRequest(
  request: Request
): Promise<JWTPayload | null> {
  const authHeader = request.headers.get('Authorization');
  const token = extractTokenFromHeader(authHeader);
  
  if (!token) return null;
  
  return verifyToken(token);
}

/**
 * Kullanıcının belirli bir kaynağa erişim yetkisi olup olmadığını kontrol eder
 */
export function hasPermission(
  userRole: UserRole,
  requiredRole: UserRole | UserRole[]
): boolean {
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  
  // Admin her şeye erişebilir
  if (userRole === UserRole.ADMIN) return true;
  
  // Diğer roller için kontrol et
  return roles.includes(userRole);
}

/**
 * Kullanıcının kendi kaynağına mı erişmeye çalıştığını kontrol eder
 */
export function isOwnerOrAdmin(
  userRole: UserRole,
  userId: number,
  resourceUserId: number
): boolean {
  return userRole === UserRole.ADMIN || userId === resourceUserId;
}
