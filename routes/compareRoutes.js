const express = require('express');
const router = express.Router();
const db = require('../db'); // Veritabanı bağlantısı

// Karşılaştırma sayfası
router.get('/', async (req, res) => {
  res.render('compare', { productsLeft: [], productsRight: [] });
});

// Ürün arama
router.get('/search', async (req, res) => {
  const { side, query } = req.query;
  const [products] = await db.execute(
    'SELECT id, name, image_url FROM products WHERE name LIKE ?',
    [`%${query}%`]
  );
  res.json(products);
});

// Karşılaştırma sonuçları
router.post('/result', async (req, res) => {
  const { product1_id, product2_id } = req.body;

  const [product1Data] = await db.execute('SELECT * FROM products WHERE id = ?', [product1_id]);
  const [product2Data] = await db.execute('SELECT * FROM products WHERE id = ?', [product2_id]);

  if (!product1Data.length || !product2Data.length) {
    return res.status(404).send('Ürün bulunamadı');
  }

  res.render('comparison-result', {
    product1: product1Data[0],
    product2: product2Data[0],
  });
});

// Karşılaştırmayı kaydetme
router.post('/save', async (req, res) => {
  const { product1_id, product2_id } = req.body;

  await db.execute(
    'INSERT INTO comparisons (product1_id, product2_id, created_at) VALUES (?, ?, NOW())',
    [product1_id, product2_id]
  );

  res.redirect('/compare');
});

module.exports = router;
