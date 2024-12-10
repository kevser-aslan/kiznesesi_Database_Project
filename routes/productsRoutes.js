const express = require('express');
const router = express.Router();

// Ürünler listesi sayfası
router.get('/', (req, res) => {
  res.render('products');  // 'products.ejs' sayfasını render eder
});

// Ürün detay sayfası
router.get('/:id', (req, res) => {
  const productId = req.params.id;
  // Burada ürün ID'sini kullanarak veritabanından ürün bilgilerini alabilirsiniz
  res.render('product-details', { id: productId });
});

// Sepet sayfası
router.get('/cart', (req, res) => {
  res.render('product-cart');  // 'product-cart.ejs' sayfasını render eder
});

module.exports = router;
