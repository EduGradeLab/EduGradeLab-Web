/**
 * MySQL veritabanı bağlantı ve yardımcı fonksiyonları
 * Güvenli ve async veritabanı işlemleri için
 */

import mysql from 'mysql2/promise';

// Veritabanı bağlantı havuzu oluştur
const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00', // UTC kullan
});

/**
 * Veritabanı bağlantısını test eder
 */
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ MySQL bağlantısı başarılı');
    return true;
  } catch (error) {
    console.error('❌ MySQL bağlantı hatası:', error);
    return false;
  }
}

/**
 * SQL sorgusu çalıştırır (SELECT)
 */
export async function executeQuery<T = unknown>(
  query: string,
  params: unknown[] = []
): Promise<T[]> {
  try {
    const [rows] = await pool.execute(query, params);
    return rows as T[];
  } catch (error) {
    console.error('SQL Query Error:', error);
    throw new Error('Veritabanı sorgu hatası');
  }
}

/**
 * SQL sorgusu çalıştırır (INSERT, UPDATE, DELETE)
 */
export async function executeUpdate(
  query: string,
  params: unknown[] = []
): Promise<mysql.ResultSetHeader> {
  try {
    const [result] = await pool.execute(query, params);
    return result as mysql.ResultSetHeader;
  } catch (error) {
    console.error('SQL Update Error:', error);
    throw new Error('Veritabanı güncelleme hatası');
  }
}

/**
 * Transaction içinde birden fazla sorgu çalıştırır
 */
export async function executeTransaction(
  queries: Array<{ query: string; params?: unknown[] }>
): Promise<unknown[]> {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const results = [];
    for (const { query, params = [] } of queries) {
      const [result] = await connection.execute(query, params);
      results.push(result);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    console.error('Transaction Error:', error);
    throw new Error('Veritabanı transaction hatası');
  } finally {
    connection.release();
  }
}

/**
 * Veritabanı tablolarını oluşturur (development/migration için)
 * Kullanıcının veritabanı yapısına göre güncellendi
 */
export async function createTables(): Promise<void> {
  const tables = [
    // Users tablosu - kullanıcı yapısına göre
    `CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      email VARCHAR(191) UNIQUE NOT NULL,
      username VARCHAR(100) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin', 'teacher') NOT NULL DEFAULT 'teacher',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_username (username),
      INDEX idx_role (role)
    )`,
    
    // Uploads tablosu - yüklenen dosyalar
    `CREATE TABLE IF NOT EXISTS uploads (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      file_url VARCHAR(512) NOT NULL,
      original_filename VARCHAR(191) NOT NULL,
      status ENUM('uploaded', 'scanning', 'scanned', 'analyzing', 'completed', 'error') NOT NULL DEFAULT 'uploaded',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
    )`,
    
    // Scanner Outputs tablosu - scanner sonuçları
    `CREATE TABLE IF NOT EXISTS scanner_outputs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      upload_id INT NOT NULL,
      scanned_image_url VARCHAR(512) DEFAULT NULL,
      status ENUM('pending', 'processing', 'completed', 'error') NOT NULL DEFAULT 'pending',
      scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      meta JSON DEFAULT NULL,
      FOREIGN KEY (upload_id) REFERENCES uploads(id) ON DELETE CASCADE,
      INDEX idx_upload_id (upload_id),
      INDEX idx_status (status)
    )`,
    
    // Analysis tablosu - AI analiz sonuçları
    `CREATE TABLE IF NOT EXISTS analysis (
      id INT PRIMARY KEY AUTO_INCREMENT,
      upload_id INT NOT NULL,
      ai_text TEXT DEFAULT NULL,
      ai_score DECIMAL(5,2) DEFAULT NULL,
      ai_feedback TEXT DEFAULT NULL,
      result_image_url VARCHAR(512) DEFAULT NULL,
      pdf_url VARCHAR(512) DEFAULT NULL,
      analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (upload_id) REFERENCES uploads(id) ON DELETE CASCADE,
      INDEX idx_upload_id (upload_id),
      INDEX idx_analyzed_at (analyzed_at)
    )`,
    
    // Logs tablosu - sistem logları
    `CREATE TABLE IF NOT EXISTS logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT DEFAULT NULL,
      action VARCHAR(191) NOT NULL,
      details TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_user_id (user_id),
      INDEX idx_action (action),
      INDEX idx_created_at (created_at)
    )`
  ];

  try {
    for (const table of tables) {
      await executeUpdate(table);
    }
    console.log('✅ Veritabanı tabloları oluşturuldu');
  } catch (error) {
    console.error('❌ Tablo oluşturma hatası:', error);
    throw error;
  }
}

export default pool;
