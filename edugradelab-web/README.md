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
```bash
# .env.example dosyasını .env.local olarak kopyalayın
cp .env.example .env.local

# Ardından .env.local dosyasını gerçek değerlerle doldurun:
```

```env
# Database Configuration
DATABASE_URL="mysql://root:password@localhost:3306/edu_gradelab_web_db"

# JWT Secrets
JWT_SECRET="your-super-secure-jwt-secret"
NEXTAUTH_SECRET="your-nextauth-secret"

# Next.js Configuration
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
```

2. **Dependencies kurulumu**
```bash
npm install
```

3. **Database setup**
```bash
npx prisma generate
npx prisma db push
```

4. **Development server başlatma**
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
