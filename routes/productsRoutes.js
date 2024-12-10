const express = require('express');
const router = express.Router();

// Örnek ürün verisi (Bu veriyi veritabanından alabilirsiniz)
const dummyProducts = [
  { id: '1', name: 'Ürün 1', description: 'Bu ürün hakkında bilgi', price: 100, image: '/images/product1.jpg' },
  { id: '2', name: 'Ürün 2', description: 'Bu ürün hakkında bilgi', price: 200, image: '/images/product2.jpg' },
];

// Ürünler listesi sayfası
router.get('/', (req, res) => {
  res.render('products', { products: dummyProducts }); // Veritabanından alınan ürünleri gönderiyoruz
});

// Ürün detay sayfası
router.get('/:id', (req, res) => {
  const productId = req.params.id;
  const product = dummyProducts.find(p => p.id === productId); // Veritabanından ürünü bul
  if (product) {
    res.render('product-details', { product: product }); // Ürün detayını gönder
  } else {
    res.status(404).send('Ürün bulunamadı');
  }
});

module.exports = router;
