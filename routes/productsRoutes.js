const express = require('express');
const router = express.Router();
const db = require('../db');  // Veritabanı bağlantısını ekliyoruz

// Ürünler listesi sayfası
router.get('/', async (req, res) => {
  try {
    // Veritabanından ürünleri al
    const [products] = await db.execute('SELECT * FROM products');
    res.render('products', { products });  // Veritabanından alınan ürünleri gönderiyoruz
  } catch (error) {
    console.error(error);
    res.status(500).send('Ürünler listelenirken bir hata oluştu.');
  }
});

// Ürün detay sayfası (Yorumları da dahil et)
router.get('/:id', async (req, res) => {
  const productId = req.params.id;

  try {
    // Ürünü veritabanından al
    const [product] = await db.execute('SELECT * FROM products WHERE id = ?', [productId]);
    if (product.length === 0) {
      return res.status(404).send('Ürün bulunamadı');
    }

    // Yorumları al
    const [reviews] = await db.execute('SELECT reviews.*, users.name AS username FROM reviews JOIN users ON reviews.user_id = users.id WHERE product_id = ?', [productId]);

    res.render('product-details', { product: product[0], reviews });
  } catch (error) {
    console.error(error);
    res.status(500).send('Ürün detayları alınırken bir hata oluştu.');
  }
});

// Yorum ekleme işlemi
router.post('/reviews/add', async (req, res) => {
  const { productId, rating, comment } = req.body;
  
  // Kullanıcı oturum bilgisi (oturum yönetimi mevcut olmalı)
  const userId = req.session.user ? req.session.user.id : null;

  if (!userId) {
    return res.status(401).send('Lütfen giriş yapın.');
  }

  try {
    const sql = 'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)';
    await db.execute(sql, [userId, productId, rating, comment]);
    res.redirect(`/products/${productId}`);  // Yorumdan sonra ürün detayına geri yönlendir
  } catch (error) {
    console.error(error);
    res.status(500).send('Yorum eklenirken bir hata oluştu.');
  }
});


// Sepete ürün ekleme
router.post('/:id/add-to-cart', async (req, res) => {
    const productId = req.params.id;
    const quantity = parseInt(req.body.quantity) || 1; // Miktar varsayılan olarak 1

    const userId = req.session.user.id; // Kullanıcı id'si (oturumdan alınacak)

    try {
        // Ürün zaten sepette var mı kontrol et
        const [existingCartItem] = await db.execute(
            'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );

        if (existingCartItem.length > 0) {
            // Eğer ürün zaten sepette varsa, miktarı güncelle
            await db.execute(
                'UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
                [quantity, userId, productId]
            );
        } else {
            // Ürün sepette yoksa yeni bir kayıt ekle
            await db.execute(
                'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
                [userId, productId, quantity]
            );
        }

        res.redirect('/cart'); // Sepet sayfasına yönlendir
    } catch (error) {
        console.error(error);
        res.status(500).send('Sepete ürün eklenirken bir hata oluştu.');
    }
});

module.exports = router;
