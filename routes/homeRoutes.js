const express = require('express');
const router = express.Router();
const db = require('../db');  // Veritabanı bağlantısı
const bcrypt = require('bcrypt');

router.get('/', (req, res) => {
    // title'ı burada parametre olarak gönderiyoruz
    res.render('index', { title: 'E-Ticaret Anasayfa' });
  });
  
// **İletişim Formunu Görüntüleme**
router.get('/support/contact', (req, res) => {
  res.render('contact-us'); // contact-us.ejs şablonunu render eder
});

// Mesajları görüntülemek için bir GET isteği
router.get('/support/messages', async (req, res) => {
  const userId = req.session.user.id; // Oturumdaki kullanıcının ID'si

  try {
      // Kullanıcının mesajlarını getir
      const [messages] = await db.execute(
          `SELECT * FROM support_messages WHERE user_id = ? ORDER BY created_at DESC`,
          [userId]
      );

      // Mesajları şablona ilet
      res.render('user-messages', { messages });
  } catch (error) {
      console.error(error);
      res.status(500).send('Mesajlar görüntülenirken bir hata oluştu.');
  }
});


// **İletişim Formu İşlemi**
router.post('/support/contact', async (req, res) => {
  const { name, email, message } = req.body;
  const userId = req.session.user.id; // Kullanıcı ID'sini oturumdan al

  try {
      // Mesajı veritabanına kaydet
      await db.execute(
          `INSERT INTO support_messages (user_id, name, email, message) 
           VALUES (?, ?, ?, ?)`,
          [userId, name, email, message] // name alanını da gönderiyoruz
      );

      // Kullanıcıya başarı mesajı göster
      res.send('Mesajınız başarıyla gönderildi, en kısa sürede size dönüş yapacağız!');
  } catch (error) {
      console.error(error);
      res.status(500).send('Mesaj gönderilirken bir hata oluştu.');
  }
});


// **Admin Paneli Mesajları Görüntüleme**
router.get('/admin/messages', async (req, res) => {
  try {
      // Admin gelen mesajları alır
      const [messages] = await db.execute('SELECT * FROM support_messages ORDER BY created_at DESC');
      
      // Admin paneline mesajları gönder
      res.render('admin-messages', { messages });
  } catch (error) {
      console.error(error);
      res.status(500).send('Mesajlar görüntülenirken bir hata oluştu.');
  }
});

// **Admin Mesaj Cevaplama**
router.post('/admin/respond/:messageId', async (req, res) => {
  const { response } = req.body;
  const messageId = req.params.messageId;

  try {
      // Mesajın cevabını veritabanına kaydet
      await db.execute(
          `UPDATE support_messages 
           SET response = ? 
           WHERE id = ?`,
          [response, messageId]
      );

      // Admin paneline yönlendir
      res.redirect('/admin/messages');
  } catch (error) {
      console.error(error);
      res.status(500).send('Cevap verirken bir hata oluştu.');
  }
});

// **Kullanıcı Mesajlarını Görüntüleme**
router.get('/user/messages', async (req, res) => {
  const userId = req.session.user.id;

  try {
      // Kullanıcıya ait mesajları al
      const [messages] = await db.execute(
          `SELECT * FROM support_messages WHERE email = ? ORDER BY created_at DESC`,
          [userId]
      );

      res.render('user-messages', { messages });
  } catch (error) {
      console.error(error);
      res.status(500).send('Mesajlar görüntülenirken bir hata oluştu.');
  }
});


module.exports = router;
