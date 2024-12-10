const express = require('express');
const router = express.Router();

// Kullanıcı girişi sayfası
router.get('/login', (req, res) => {
  res.render('login');  // 'login.ejs' sayfasını render eder
});

// Kullanıcı kaydı sayfası
router.get('/signup', (req, res) => {
  res.render('signup');  // 'signup.ejs' sayfasını render eder
});

// Hesap ayarları
router.get('/account-settings', (req, res) => {
    res.render('account-settings');  // 'account-settings.ejs' sayfasını render eder
  });
module.exports = router;
