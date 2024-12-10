const express = require('express');
const router = express.Router();

// Sepet sayfası
router.get('/', (req, res) => {
    res.render('product-cart'); 
});

// Sepetten ürün silme (Örnek)
router.post('/remove/:id', (req, res) => {
  const productId = req.params.id;
  // Ürünü sepetteki veritabanından veya session'dan kaldırabilirsiniz
  res.render('product-cart');  // Sepet sayfasına yönlendir
});

module.exports = router;
