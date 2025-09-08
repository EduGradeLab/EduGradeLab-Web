/**
 * JWT token ve authentication yardımcı fonksiyonları
 * Güvenli kimlik doğrulama için
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWTPayload, User, UserRole } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
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
 * JWT token oluşturur
 */
export function createToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET!, {
    expiresIn: JWT_EXPIRES_IN,
    algorithm: 'HS256',
  });
}

/**
 * JWT token'ı doğrular ve decode eder
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET!) as JWTPayload;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
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

/**
 * Email formatını doğrular
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Şifre güvenlik kriterlerini kontrol eder
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Şifre en az 8 karakter olmalıdır');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Şifre en az bir büyük harf içermelidir');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Şifre en az bir küçük harf içermelidir');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Şifre en az bir rakam içermelidir');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Rate limiting için basit token bucket implementasyonu
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 dakika
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);
    
    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return true;
    }
    
    if (attempt.count >= this.maxAttempts) {
      return false;
    }
    
    attempt.count++;
    return true;
  }
  
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}
