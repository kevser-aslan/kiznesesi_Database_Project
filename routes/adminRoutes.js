const express = require('express');
const router = express.Router();
const db = require('../db');  // Veritabanı bağlantısı
const multer = require('multer');
const path = require('path');
const upload = multer({ dest: 'public/uploads/' });


// Ürün ekleme işlemi
router.post('/products/add', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'feature1_image', maxCount: 1 },
  { name: 'feature2_image', maxCount: 1 }
]), async (req, res) => {
  const { name, description, price, stock, category, feature1_name, feature2_name } = req.body;

  const productImage = req.files['image'] ? '/uploads/' + req.files['image'][0].filename : null;
  const feature1Image = req.files['feature1_image'] ? '/uploads/' + req.files['feature1_image'][0].filename : null;
  const feature2Image = req.files['feature2_image'] ? '/uploads/' + req.files['feature2_image'][0].filename : null;

  try {
      // Ürünü ekle
      const [result] = await db.execute(
          `INSERT INTO products (name, description, price, stock, category_id, image_url)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [name, description, price, stock, category, productImage]
      );

      const productId = result.insertId;

      // Özellik 1 ekleme
      if (feature1_name) {
          await db.execute(
              `INSERT INTO product_features (product_id, feature_name, feature_image)
               VALUES (?, ?, ?)`,
              [productId, feature1_name, feature1Image]
          );
      }

      // Özellik 2 ekleme
      if (feature2_name) {
          await db.execute(
              `INSERT INTO product_features (product_id, feature_name, feature_image)
               VALUES (?, ?, ?)`,
              [productId, feature2_name, feature2Image]
          );
      }

      res.redirect('/admin/products'); // Ürünler listesine yönlendir
  } catch (error) {
      console.error(error);
      res.status(500).send('Ürün eklenirken bir hata oluştu.');
  }
});
  
// ********************************

// Yorum ekleme
router.post('/products/review/add/:productId', async (req, res) => {
  const productId = req.params.productId;
  const { rating, comment } = req.body;
  const userId = req.session.user ? req.session.user.id : null;

  try {
    // Admin yorumu olarak veritabanına ekle
    await db.execute(
      'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
      [productId, userId, rating, comment]
    );
    res.redirect('/admin/products'); // Ürünler listesine yönlendir
  } catch (error) {
    console.error(error);
    res.status(500).send('Yorum eklenirken bir hata oluştu.');
  }
});


// Yorum düzenleme
router.get('/products/review/edit/:reviewId', async (req, res) => {
  const reviewId = req.params.reviewId;

  try {
    const [review] = await db.execute('SELECT * FROM reviews WHERE id = ?', [reviewId]);
    if (review.length === 0) {
      return res.status(404).send('Yorum bulunamadı');
    }

    res.render('admin/edit-review', { review: review[0] });
  } catch (error) {
    console.error(error);
    res.status(500).send('Yorum düzenlenirken bir hata oluştu.');
  }
});

// Yorum düzenleme işlemi
router.post('/products/review/edit/:reviewId', async (req, res) => {
  const reviewId = req.params.reviewId;
  const { rating, comment } = req.body;

  try {
    // Yorum güncelle
    await db.execute(
      'UPDATE reviews SET rating = ?, comment = ? WHERE id = ?',
      [rating, comment, reviewId]
    );
    res.redirect('/admin/products');
  } catch (error) {
    console.error(error);
    res.status(500).send('Yorum düzenlenirken bir hata oluştu.');
  }
});

// Yorum silme
router.get('/products/review/delete/:reviewId', async (req, res) => {
  const reviewId = req.params.reviewId;

  try {
    // Yorum sil
    await db.execute('DELETE FROM reviews WHERE id = ?', [reviewId]);
    res.redirect('/admin/products');
  } catch (error) {
    console.error(error);
    res.status(500).send('Yorum silinirken bir hata oluştu.');
  }
});

// ********************************
// Kategoriler listesi için veri çekme
router.get('/products/add', async (req, res) => {
  try {
    const [categories] = await db.execute('SELECT * FROM categories');
    res.render('admin/addProduct', { categories });
  } catch (error) {
    console.error(error);
    res.status(500).send('Kategoriler alınırken bir hata oluştu.');
  }
});

  router.get('/messages', async (req, res) => {
    try {
        // Tüm mesajları getir
        const [messages] = await db.execute(
            `SELECT * FROM support_messages ORDER BY created_at DESC`
        );

        // Mesajları admin şablonuna ilet
        res.render('admin-messages', { messages });
    } catch (error) {
        console.error(error);
        res.status(500).send('Mesajları görüntülerken bir hata oluştu.');
    }
});

router.post('/respond/:messageId', async (req, res) => {
  const { response } = req.body; // Adminin cevabı
  const messageId = req.params.messageId; // Mesaj ID

  try {
      // Veritabanında mesajı güncelle
      await db.execute(
          `UPDATE support_messages 
           SET response = ? 
           WHERE id = ?`,
          [response, messageId]
      );

      // Admin paneline geri yönlendir
      res.redirect('/admin/messages');
  } catch (error) {
      console.error(error);
      res.status(500).send('Cevap verirken bir hata oluştu.');
  }
});
// Admin ürün sayfası ve yorumları listeleme
router.get('/products', async (req, res) => {
  try {
    // Ürünleri ve her ürüne ait yorumları al
    const [products] = await db.execute(`
      SELECT products.*, 
             JSON_ARRAYAGG(
               JSON_OBJECT(
                 'id', reviews.id,
                 'username', users.name,
                 'rating', reviews.rating,
                 'comment', reviews.comment,
                 'is_admin', IF(users.role = 'admin', 1, 0)
               )
             ) AS reviews
      FROM products
      LEFT JOIN reviews ON reviews.product_id = products.id
      LEFT JOIN users ON users.id = reviews.user_id
      GROUP BY products.id
    `);
    

    res.render('admin/products', { products });
  } catch (error) {
    console.error(error);
    res.status(500).send('Ürünler listelenirken bir hata oluştu.');
  }
});


module.exports = router;
