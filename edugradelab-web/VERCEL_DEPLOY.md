# EduGradeLab-Web Vercel Deployment Guide

## 🚀 Vercel'e Deploy Etme Adımları

### 1. GitHub Repository Hazırlığı
```bash
git add .
git commit -m "feat: prepare project for Vercel deployment"
git push origin main
```

### 2. Vercel Dashboard Kurulumu

1. **Vercel hesabınıza giriş yapın**: https://vercel.com
2. **"Add New Project"** tıklayın
3. **GitHub repository'sini seçin**: `EduGradeLab-Web`
4. **Framework**: Next.js (otomatik algılanır)
5. **Root Directory**: `edugradelab-web/`

### 3. Environment Variables Kurulumu

Vercel Dashboard'da **Settings > Environment Variables** bölümünde şunları ekleyin:

```env
# Database
DATABASE_URL=mysql://root:bMYDUJx6usmjOFiV36HqUUD8i40SiuM@95.70.204.147:3306/edu_gradelab_web_db

# Authentication
JWT_SECRET=ae30f981543a0d7caac571bbbc017a82b2f7433e1ea65ba6c533672be852d8b2
NEXTAUTH_SECRET=edugradelab-nextauth-secret-2025
NEXTAUTH_URL=https://your-vercel-domain.vercel.app

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_YOUR_TOKEN_HERE

# App Config
NODE_ENV=production
```

**Not:** Local development için tüm environment variables `.env.local` dosyasında toplanmıştır.

### 4. Vercel Blob Storage Kurulumu

1. Vercel Dashboard'da **Storage** sekmesine gidin
2. **"Create Database"** > **"Blob"** seçin
3. **Store Name**: `edugradelab-uploads`
4. **Token'ı kopyalayın** ve `BLOB_READ_WRITE_TOKEN` olarak ekleyin

### 5. Build Commands (Otomatik)

Vercel otomatik olarak şunları çalıştırır:
- **Install**: `npm install`
- **Build**: `npm run build` (prisma generate dahil)
- **Start**: `npm start`

### 6. Domain Kurulumu

1. **Settings > Domains**
2. Custom domain ekleyin (opsiyonel)
3. DNS ayarlarını yapın

## 🔧 Production Environment

### Database
- **Host**: 95.70.204.147:3306
- **Database**: edu_gradelab_web_db  
- **SSL**: Destekleniyor

### Özellikler
- ✅ Server-side Rendering (SSR)
- ✅ API Routes (/api/auth/*, /api/upload/*)
- ✅ File Upload (Vercel Blob)
- ✅ MySQL Database (Prisma)
- ✅ JWT Authentication
- ✅ Rate Limiting
- ✅ Security Headers

### Performance
- **Function Timeout**: 30 saniye
- **Memory**: 1024MB (Vercel Pro)
- **Region**: Europe (fra1)

## 🚨 Deploy Sonrası Kontroller

1. **Database Connection**: `/api/health`
2. **Authentication**: `/auth/login`
3. **File Upload**: Dashboard'da dosya yükleme
4. **API Endpoints**: Tüm REST endpoint'leri

## 🔄 Continuous Deployment

Git push ile otomatik deploy:
```bash
git add .
git commit -m "update: feature description"
git push origin main
# Vercel otomatik olarak deploy eder
```

## 🛠 Debug & Monitoring

- **Logs**: Vercel Functions tab
- **Analytics**: Vercel Analytics
- **Performance**: Core Web Vitals

---

**🎉 Deploy tamamlandıktan sonra production URL'ini paylaşın!**
