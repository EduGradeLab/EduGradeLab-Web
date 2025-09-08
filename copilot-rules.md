# Proje Kodlama Kuralları ve VSCode Copilot Rehberi

Bu proje, **Next.js + Tailwind CSS + Vercel Blob Storage + MySQL** stack üzerinde, **mobil öncelikli**, güvenli ve kolay genişletilebilir şekilde geliştirilecektir. Tüm kodlama Copilot ile yapılırken aşağıdaki kurallara ve mimari prensiplere **mutlaka uyulacaktır**.

---

## 1. Genel Mimari Kurallar

- **Mobile-first**: Tüm componentler ve sayfa düzenleri, önce mobilde sorunsuz çalışacak şekilde yazılacak. Masaüstü desteği ikinci planda.
- **Component tabanlı mimari**: UI elemanları (input, buton, kart, form, dialog, vs) bağımsız ve tekrar kullanılabilir componentler halinde yazılacak.
- **API-first**: Tüm iş mantığı (fotoğraf upload, analiz sonucu, kullanıcı/rol yönetimi) RESTful API üzerinden çalışacak. Frontend ile backend ayrı kodlanacak.
- **State Management**: Async işlemler ve kullanıcı state’i için `Zustand` veya `Redux` kullanılacak.
- **Typescript** zorunlu! Tüm dosyalar ve tip tanımları TS olacak.
- **Tailwind CSS**: Styling ve responsive tasarım için sadece Tailwind kullanılacak, ek custom CSS yazılmayacak.

---

## 2. Güvenlik ve Yetkilendirme

- **JWT ile Auth**: Giriş yapan kullanıcılar için JWT kullanılacak. Tokenlar asla localStorage yerine secure httpOnly cookie’de saklanacak.
- **Rol Bazlı Erişim**: Her endpoint ve sayfa, kullanıcının rolüne (öğretmen/admin) göre erişim kontrolüyle yazılacak. İleride yeni roller kolayca eklenebilecek şekilde tasarlanacak.
- **Şifre Hash**: Tüm kullanıcı şifreleri backend’de `bcrypt` ile hash’lenip MySQL’de saklanacak.
- **Dosya erişimi**: Yüklenen her dosya, sadece sahibi (öğretmen) ve admin tarafından erişilebilir olacak. 
- **Input Validation**: Tüm kullanıcı girdileri backend tarafında mutlaka sanitize ve validate edilecek.
- **Security**: Butun gizli bilgiler ornegin tokenler db anahtarlari vb. .env.local dosyasinda saklanacak.

---

## 3. Dosya ve Storage Yönetimi

- **Vercel Blob Storage**: Tüm yüklenen fotoğraflar Vercel Blob’a kaydedilecek, ileride S3/MinIO gibi servislere migration kolaylığı için storage servisi modüler yazılacak.
- **Upload Geçmişi ve Loglar**: Her dosya yüklemesi ve analiz sonucu MySQL DB’de kullanıcı-id ve timestamp ile loglanacak.
- **PDF Rapor**: AI analiz çıktısı hem ekranda (görsel+text) gösterilecek, hem de PDF olarak indirilebilecek.

---

## 4. Async ve Bildirim Yönetimi

- **Polling**: Upload ve analiz işlemleri async olarak çalışır. Kullanıcıya süreç boyunca “işleniyor” spinner/gif gösterilir. Sonuç polling ile güncellenir.
- **Websocket yok**: Şu an için async event’ler polling ile yönetilecek.

---

## 5. Kod Kalitesi ve Standartları

- **Typescript ve Eslint kuralları** zorunlu. Kodlar `eslint --fix` ile hatasız yazılacak.
- **Component/Api isimlendirmesi** açık ve İngilizce.
- **Test Coverage** (opsiyonel ama tavsiye): Unit testler için Jest/React Testing Library kullanılabilir.
- **Kod tekrarına izin verilmez**. Her işlev reusable component/fonksiyon şeklinde yazılır.

---

## 6. Uluslararasılaşma ve Dil

- **Türkçe default** ama tüm metinler/label’lar ileride i18n ile genişletilebilecek şekilde yazılacak.

---

## 7. DevOps ve Deployment

- **Vercel** deploy uyumlu. SSR/ISR gibi Next.js özellikleri kullanılırsa, serverless uyumlu yazılır.
- **.env dosyaları** sensitive bilgileri içerir ve asla repoya yüklenmez!

---
## 8. Kodun dosya/folder düzenini asla bozmadan ilerle:
Kodun dosya/folder düzenini asla bozmadan ilerle:
- Her React component, API route, util fonksiyonu, ayrı ve tek bir işleve odaklı dosyalarda olmalı.
- Hiçbir dosya (component, API, util vs) **1000 satırı geçmemeli**. Satır sayısı yaklaşırsa Copilot yeni bir dosya/folder oluşturarak işlevi bölsün.
- Büyük componentlerde **mantığı alt componentlere**, büyük API route'larda **yardımcı fonksiyonları /lib veya /utils klasörüne** böl.
- UI, API, helper fonksiyonları ve context/store kodları **her zaman kendi dosyasında** olsun, ana dosyada asla şişme olmasın.
- Dosya ve klasör hiyerarşisi **her zaman okunabilir ve temiz** olsun. Her klasörün içinde bir index.tsx/ts veya README.md açıklama dosyası bulunabilir.
- Kodun üstüne, neden bu bölmeyi yaptığını kısaca yaz (örn: “Bu component, 1000 satırı geçtiği için bölündü…” gibi açıklama).
- Hiçbir component, util veya API route çok uzarsa, **otomatik olarak alt componentlere veya fonksiyonlara böl** ve dosya yolunu açıkça belirt.
- Kod ve dosya açıklamalarında, component/fonksiyonun amacı ve ilişkili diğer dosyalar kısa not olarak verilmeli.

## 9. Chat Raporu

-- hersey bittikten sonra bana verdigin raporda cok uzun olmayan bir commit mesaji ver.
