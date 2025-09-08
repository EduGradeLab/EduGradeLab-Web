# EduGradeLab Web Platform

**Mobil-first, AI destekli sınav kağıdı analiz ve değerlendirme platformu**

## 🚀 Özellikler

### ✨ Temel Özellikler
- **Mobil-first tasarım** - Responsive ve dokunmatik uyumlu arayüz
- **Rol tabanlı erişim** - Öğretmen ve Admin rolleri
- **JWT Authentication** - Güvenli kimlik doğrulama
- **Dosya yükleme** - Sınav kağıtları için drag & drop desteği
- **AI analiz** - Otomatik sınav değerlendirme
- **PDF rapor** - Analiz sonuçlarını PDF olarak indirme
- **Real-time polling** - Analiz durumu canlı takibi

### 🛡️ Güvenlik
- bcrypt ile şifre hashleme
- JWT token tabanlı yetkilendirme
- Rol bazlı endpoint koruması
- Rate limiting
- Input validation ve sanitization

### 📱 Mobil Uyumluluk
- PWA-ready yapı
- Touch-friendly UI componentleri
- Offline çalışabilir tasarım
- Native app benzeri deneyim

## 🛠️ Teknoloji Stack

### Frontend
- **Next.js 14** (App Router)
- **TypeScript** - Tip güvenliği
- **Tailwind CSS** - Utility-first styling
- **Zustand** - State management
- **Lucide React** - Modern iconlar

### Backend
- **Next.js API Routes**
- **MySQL** - Veritabanı
- **Vercel Blob Storage** - Dosya depolama
- **JWT** - Authentication

### UI Components
- Custom component library
- Mobil-first tasarım
- Accessibility (a11y) desteği
- Shadcn/ui benzeri yapı

## 🚦 Başlangıç

### Gereksinimler
- Node.js 18+
- MySQL 8.0+
- Vercel hesabı (Blob Storage için)

### Kurulum

1. **Environment değişkenlerini ayarlama**
```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/edugradelab"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"

# Webhook URLs
SCANNER_WEBHOOK_URL="https://your-scanner-service.com/webhook"
AI_ANALYSIS_WEBHOOK_URL="https://your-ai-service.com/webhook"
```

2. **Development server başlatma**
```bash
npm run dev
```

Uygulama http://localhost:3000 adresinde çalışacak.

## 📋 API Endpoints

### Authentication
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/register` - Kullanıcı kaydı

### File Management
- `POST /api/uploads` - Dosya yükleme
- `GET /api/uploads` - Dosya listesi

### Analysis
- `GET /api/analysis` - Analiz sonuçları
- `GET /api/analysis?fileId=123` - Spesifik dosya analizi

### Webhooks
- `POST /api/webhook/scanner` - Scanner sonuçları
- `POST /api/webhook/ai-analysis` - AI analiz sonuçları

## 🎯 Kullanım Senaryoları

### Öğretmen Kullanımı
1. Sisteme giriş yap
2. Sınav kağıdını yükle (JPG, PNG, PDF)
3. Otomatik tarama ve analiz sürecini bekle
4. Analiz sonuçlarını görüntüle
5. PDF rapor indir
6. Geçmiş analizleri görüntüle

### Admin Kullanımı
- Tüm kullanıcıların dosyalarını görüntüleme
- Sistem geneli istatistikler
- Kullanıcı yönetimi (gelecek özellik)

---

**EduGradeLab** - Eğitimde AI'ın gücünü kullanarak öğretmenlerin hayatını kolaylaştırıyoruz. 🎓✨
