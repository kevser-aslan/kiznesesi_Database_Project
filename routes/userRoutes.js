const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../db'); // Veritabanı bağlantısı
const session = require('express-session');

// Kullanıcı giriş kontrolü middleware
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/user/login');
  }
  next();
}

// Kullanıcı giriş sayfası
router.get('/login', (req, res) => {
  res.render('login'); // 'login.ejs' sayfasını render eder
});

// Kullanıcı giriş
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
      const user = rows[0];
      if (user && await bcrypt.compare(password, user.password)) {
        // Giriş başarılı
        req.session.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          phone_number: user.phone_number,
          address: user.address,
          role: user.role,
        };
  
        // Role'e göre yönlendirme
        if (user.role === 'admin') {
          res.redirect('/user/admin-dashboard'); // Admin paneline yönlendir
        } else {
          res.redirect('/user/user-dashboard'); // Kullanıcı dashboard'una yönlendir
        }
      } else {
        res.status(401).send('Geçersiz e-posta veya şifre.');
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Giriş sırasında bir hata oluştu.');
    }
  });

// Kullanıcı kayıt sayfası
router.get('/signup', (req, res) => {
  res.render('signup'); // 'signup.ejs' sayfasını render eder
});

// Kullanıcı kayıt
router.post('/signup', async (req, res) => {
  const { name, email, password, phone_number, address, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `
      INSERT INTO users (name, email, password, phone_number, address, role, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    await db.execute(sql, [name, email, hashedPassword, phone_number, address, role]);
    res.redirect('/user/login');
  } catch (err) {
    console.error(err);
    res.status(500).send('Kayıt sırasında bir hata oluştu.');
  }
});

// Kullanıcı Dashboard
router.get('/user-dashboard', requireLogin, (req, res) => {
    res.render('user/userDashboard', { user: req.session.user });
  });


  // Admin Dashboard
router.get('/admin-dashboard', requireLogin, (req, res) => {
    // Admin'e özel sayfa, admin bilgilerini de alabiliriz
    if (req.session.user.role === 'admin') {
      res.render('admin/adminDashboard', { user: req.session.user });
    } else {
      res.redirect('/user-dashboard'); // Eğer admin değilse, normal kullanıcıya yönlendir
    }
  });
// Kullanıcı çıkışı
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Çıkış sırasında bir hata oluştu.');
    }
    res.redirect('/user/login');
  });
});


// Hesap ayarları
router.get('/account-settings', requireLogin, (req, res) => {
  res.render('account-settings', { user: req.session.user }); // Kullanıcı oturum bilgilerini gönder
});

module.exports = router;
