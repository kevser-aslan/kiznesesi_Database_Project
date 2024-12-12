# Kiz Nesesi Database Project 🎵📦

Bu proje, kullanıcıların müzik ve alışveriş deneyimini bir araya getiren bir e-ticaret platformudur. 📱🛍️ Node.js, Express.js ve MySQL kullanılarak geliştirilmiştir. 👩‍💻✨

## Özellikler 🌟
- 🚀 **Kullanıcı Kaydı ve Giriş:**
  - Şifreler güvenli bir şekilde hashlenerek saklanır.
  - Kullanıcı rolleri ve ek bilgileri desteklenir.
- 📋 **Veritabanı Yönetimi:**
  - Kullanıcı, ürün, sipariş ve ödeme bilgileri için optimize edilmiş tablolar.
- 🛒 **E-ticaret İşlevleri:**
  - Ürün listeleme, karşılaştırma ve kullanıcı özel dashboard desteği.
- 🎨 **Modern Tasarım:**
  - Bootstrap ve özel CSS ile responsive ve şık bir kullanıcı arayüzü.

## Kullanılan Teknolojiler 🛠️
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Frontend:** HTML, EJS, CSS, Bootstrap
- **Diğer:** bcrypt, express-session

## Kurulum 🛠️
Projeyi çalıştırmak için aşağıdaki adımları izleyin:

1. **Projeyi klonlayın:**
   ```bash
   git clone https://github.com/kullaniciadi/kiznesesi-database-project.git
   cd kiznesesi-database-project
   ```

2. **Gerekli bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

3. **Veritabanını oluşturun:**
   - MySQL Workbench kullanarak gerekli tabloları oluşturun (SQL dosyası proje kök dizinindedir).

4. **Ortam değişkenlerini ayarlayın:**
   `.env` dosyasını oluşturun ve aşağıdaki değişkenleri tanımlayın:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=yourpassword
   DB_NAME=eticaret
   SESSION_SECRET=yourSecret
   ```

5. **Sunucuyu başlatın:**
   ```bash
   npm start
   ```

6. **Projeyi tarayıcıda açın:**
   `http://localhost:3000`

## Dosya Yapısı 📂
```
.
├── views/                # EJS sayfaları
├── routes/               # Express.js route dosyaları
├── public/               # Statik dosyalar (CSS, JS, img)
├── db.js                 # Veritabanı bağlantısı
├── app.js                # Uygulama giriş noktası
├── .env                  # Ortam değişkenleri
└── README.md             # Proje açıklaması
```

## Yapılacaklar 📝
- [ ] Ürün filtreleme ve sıralama özelliği ekle.
- [ ] Kullanıcı bildirim sistemi geliştir.
- [ ] Daha fazla ödeme seçeneği ekle.

## Katkıda Bulunun 🤝
Katkılarınızı görmek için sabırsızlanıyoruz! 🎉 Projeyi fork'layabilir, kendi geliştirmelerinizi yapabilir ve PR gönderebilirsiniz.

## Lisans 📜
Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.

💻✨

