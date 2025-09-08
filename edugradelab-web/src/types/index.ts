/**
 * User ve Role interface tanımları
 * Veritabanı yapısına göre güncellendi
 */

export interface User {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  created_at: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher'
}

export interface JWTPayload {
  userId: number;
  email: string;
  username: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Upload ve ilgili tablolar için tip tanımları
 * Veritabanı yapısına göre güncellendi
 */
export interface Upload {
  id: number;
  user_id: number;
  file_name: string;
  original_name: string;
  file_size: number;
  content_type: string;
  upload_path: string;
  file_url: string;
  uploaded_at: Date;
}

export enum UploadStatus {
  UPLOADED = 'uploaded',
  SCANNING = 'scanning',
  SCANNED = 'scanned',
  ANALYZING = 'analyzing',
  COMPLETED = 'completed',
  ERROR = 'error'
}

export enum AnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error'
}

export enum FileStatus {
  UPLOADED = 'uploaded',
  SCANNING = 'scanning',
  SCANNED = 'scanned',
  ANALYZING = 'analyzing',
  COMPLETED = 'completed',
  ERROR = 'error'
}

export interface ScannerOutput {
  id: number;
  upload_id: number;
  user_id: number;
  status: string;
  scanned_text?: string;
  questions_detected?: number;
  answers_detected?: number;
  scanned_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export enum ScannerStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error'
}

export interface Analysis {
  id: number;
  upload_id: number;
  user_id: number;
  status: AnalysisStatus;
  total_questions?: number;
  correct_answers?: number;
  wrong_answers?: number;
  blank_answers?: number;
  score?: number;
  result_data?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface SystemLog {
  id: number;
  user_id?: number;
  action: string;
  details?: string;
  created_at: Date;
}

/**
 * Form validation tipler
 */
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * API Response tipler
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message: string;
  meta?: Record<string, unknown>;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface UploadResponse {
  upload: Upload;
  message: string;
}

/**
 * Webhook payload tipler
 */
export interface ScannerWebhookPayload {
  uploadId: number;
  status: 'success' | 'error';
  scannedImageUrl?: string;
  meta?: any;
  error?: string;
}

export interface AIAnalysisWebhookPayload {
  uploadId: number;
  analysisId: number;
  status: 'success' | 'error';
  aiText?: string;
  aiScore?: number;
  aiFeedback?: string;
  resultImageUrl?: string;
  pdfUrl?: string;
  error?: string;
}
