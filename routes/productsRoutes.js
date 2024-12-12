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

router.get('/:id', async (req, res) => {
  const productId = req.params.id;
  const sort = req.query.sort || 'newest';

  try {
    // Ürün bilgilerini al
    const [product] = await db.execute('SELECT * FROM products WHERE id = ?', [productId]);
    if (product.length === 0) {
      return res.status(404).send('Ürün bulunamadı');
    }

    let orderBy = 'created_at DESC'; // Varsayılan: En yeni
    if (sort === 'highest') {
      orderBy = 'rating DESC';
    } else if (sort === 'helpful') {
      orderBy = '(SELECT SUM(vote) FROM review_votes WHERE review_id = reviews.id) DESC';
    }

    // Yorumları al
    const [reviews] = await db.execute(
      `SELECT reviews.*, users.name AS username,
              (SELECT SUM(vote) FROM review_votes WHERE review_id = reviews.id) AS helpful_votes
       FROM reviews
       JOIN users ON reviews.user_id = users.id
       WHERE product_id = ?
       ORDER BY ${orderBy}`,
      [productId]
    );

    // Yanıtları al
    const [replies] = await db.execute(
      `SELECT comment_replies.*, users.name AS username 
       FROM comment_replies 
       JOIN users ON comment_replies.user_id = users.id`
    );

    // Yorumlar ile yanıtları birleştir
    const reviewsWithReplies = reviews.map((review) => ({
      ...review,
      replies: replies.filter((reply) => reply.review_id === review.id),
    }));

    // Ürün ve yorumları EJS'ye gönder
    res.render('product-details', {
      product: product[0], // İlk ürün bilgisi
      reviews: reviewsWithReplies,
      sort,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Ürün detayları alınırken bir hata oluştu.');
  }
});


// Yorumlara yanıt ekleme
router.post('/reviews/reply', async (req, res) => {
  const { reviewId, replyText } = req.body;
  const userId = req.session.user ? req.session.user.id : null;

  if (!userId) {
    return res.status(401).send('Lütfen giriş yapın.');
  }

  try {
    const sql = 'INSERT INTO comment_replies (review_id, user_id, reply_text) VALUES (?, ?, ?)';
    await db.execute(sql, [reviewId, userId, replyText]);
    res.redirect('back'); // Aynı sayfaya geri dön
  } catch (error) {
    console.error(error);
    res.status(500).send('Yanıt eklenirken bir hata oluştu.');
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

router.post('/reviews/:id/vote', async (req, res) => {
  const { id } = req.params; // Yoruma ait ID
  const { vote } = req.body; // Kullanıcı oy değeri (1 veya -1)
  const userId = req.session.user ? req.session.user.id : null;

  if (!userId) {
    return res.status(401).send('Lütfen giriş yapın.');
  }

  try {
    // Daha önce aynı kullanıcı bu yoruma oy verdiyse güncelle
    const [existingVote] = await db.execute(
      'SELECT * FROM review_votes WHERE review_id = ? AND user_id = ?',
      [id, userId]
    );

    if (existingVote.length > 0) {
      await db.execute(
        'UPDATE review_votes SET vote = ?, created_at = NOW() WHERE id = ?',
        [vote, existingVote[0].id]
      );
    } else {
      // Yeni bir oy ekle
      await db.execute(
        'INSERT INTO review_votes (review_id, user_id, vote) VALUES (?, ?, ?)',
        [id, userId, vote]
      );
    }

    res.status(200).send('Oyunuz başarıyla kaydedildi.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Oylama işlemi sırasında bir hata oluştu.');
  }
});

router.get('/:id/reviews', async (req, res) => {
  const { id } = req.params;
  const { sort } = req.query; // "newest", "highest", "helpful"

  let orderBy = 'created_at DESC'; // Varsayılan: En yeni

  if (sort === 'highest') {
    orderBy = 'rating DESC';
  } else if (sort === 'helpful') {
    orderBy = '(SELECT SUM(vote) FROM review_votes WHERE review_id = reviews.id) DESC';
  }

  try {
    const [reviews] = await db.execute(
      `SELECT reviews.*, users.name AS username,
              (SELECT SUM(vote) FROM review_votes WHERE review_id = reviews.id) AS helpful_votes
       FROM reviews
       JOIN users ON reviews.user_id = users.id
       WHERE product_id = ?
       ORDER BY ${orderBy}`,
      [id]
    );

    res.render('product-details', { reviews });
  } catch (error) {
    console.error(error);
    res.status(500).send('Yorumlar alınırken bir hata oluştu.');
  }
});


module.exports = router;
