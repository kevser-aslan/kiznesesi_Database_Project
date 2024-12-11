require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const mysql = require('mysql2');


// Uygulama Başlatma
const app = express();
const port = process.env.PORT || 3000;

// Oturum ayarları
app.use(
    session({
      secret: '1a25df58s5',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }, // HTTPS varsa true yapın
    })
  );

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'ecommerce-secret',
  resave: false,
  saveUninitialized: true,
}));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database Bağlantısı
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error('Veritabanı bağlantısı başarısız:', err.message);
  } else {
    console.log('Veritabanına bağlanıldı.');
  }
});

// Routes - Her bir route dosyasını manuel dahil ediyoruz
const homeRoutes = require('./routes/homeRoutes');  // Ana sayfa rotası
const productsRoutes = require('./routes/productsRoutes');  // Ürünler rotası
const cartRoutes = require('./routes/cartRoutes');  // Sepet rotası
const userRoutes = require('./routes/userRoutes');  // Kullanıcı işlemleri rotası
const adminRoutes = require('./routes/adminRoutes');  // admin  işlemleri rotası
const contactRoutes = require('./routes/contactRoutes');  // İletişim rotasını dahil ediyoruz
const aboutRoutes = require('./routes/aboutRoutes');  // About rotasını dahil ediyoruz
const profileRoutes = require('./routes/profileRoutes');



// Routes tanımlamaları
app.use('/', homeRoutes);  // Ana sayfa
app.use('/products', productsRoutes);  // Ürünler

app.use('/cart', cartRoutes);  // Sepet
app.use('/user', userRoutes);  // Kullanıcı
app.use('/admin', adminRoutes);  // admin
app.use('/contact', contactRoutes);  // İletişim sayfası rotası
app.use('/about', aboutRoutes);  // About sayfası rotası
app.use('/profile', profileRoutes);  // Profil sayfası rotasını ekle
// 404 Hata Sayfası
app.use((req, res) => {
  res.status(404).render('404', { title: 'Sayfa Bulunamadı' });
});

// Sunucu Başlatma
app.listen(port, () => {
  console.log(`Sunucu çalışıyor: http://localhost:${port}`);
});
