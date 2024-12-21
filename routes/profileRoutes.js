// routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');  // Veritabanı bağlantısı
const bcrypt = require('bcrypt');

// Kullanıcı profilini görüntüleme
router.get('/', (req, res) => {
  const userId = req.session.user.id; // Oturumdan kullanıcı ID'sini al

  db.execute('SELECT * FROM users WHERE id = ?', [userId])
    .then(([user]) => {
      if (user.length === 0) {
        return res.status(404).send('Kullanıcı bulunamadı');
      }
      res.render('user/profile', { user: user[0] });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Profil bilgileri alınırken bir hata oluştu.');
    });
});

// Profil güncelleme route'u
router.post('/update', async (req, res) => {
    const userId = req.session.user.id; // Oturumdaki kullanıcı ID'sini al
    const { name, email, address, phone_number, password } = req.body; // Form verilerini al

    try {
        // Şifreyi güncellemek istiyorsa, hashle
        let hashedPassword;
        if (password) {
            const saltRounds = 10;
            hashedPassword = await bcrypt.hash(password, saltRounds); // Şifreyi hashle
        } else {
            // Şifre güncellenmemişse, eski şifreyi kullan
            hashedPassword = null;
        }

        // Eğer şifre güncellenmemişse, sadece diğer alanları güncelle
        let sql = 'UPDATE users SET name = ?, email = ?, address = ?, phone_number = ?';
        let values = [name, email, address, phone_number];

        // Eğer şifre varsa, onu da güncelle
        if (hashedPassword) {
            sql += ', password = ?';
            values.push(hashedPassword);
        }

        // Kullanıcıyı güncelle
        sql += ' WHERE id = ?';
        values.push(userId);

        await db.execute(sql, values);

        // Güncelleme başarılıysa, kullanıcıyı profil sayfasına yönlendir
        res.redirect('/profile');
    } catch (error) {
        console.error(error);
        res.status(500).send('Profil güncellenirken bir hata oluştu');
    }
});


// Şifre güncelleme route'u
router.post('/update-password', async (req, res) => {
  const userId = req.session.user.id; // Oturumdaki kullanıcı ID'sini al
  const { current_password, new_password, confirm_password } = req.body;

  try {
      // Şifrelerin eşleştiğini kontrol et
      if (new_password !== confirm_password) {
          return res.status(400).send('Yeni şifre ve onay şifresi eşleşmiyor.');
      }

      // Mevcut şifreyi veritabanından al
      const [[user]] = await db.execute('SELECT password FROM users WHERE id = ?', [userId]);
      if (!user) {
          return res.status(404).send('Kullanıcı bulunamadı.');
      }

      // Mevcut şifreyi doğrula
      const passwordMatch = await bcrypt.compare(current_password, user.password);
      if (!passwordMatch) {
          return res.status(400).send('Mevcut şifre yanlış.');
      }

      // Yeni şifreyi hashle ve güncelle
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(new_password, saltRounds);
      await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

      res.redirect('/profile'); // Güncelleme başarılıysa profil sayfasına yönlendir
  } catch (error) {
      console.error(error);
      res.status(500).send('Şifre güncellenirken bir hata oluştu.');
  }
});

module.exports = router;
