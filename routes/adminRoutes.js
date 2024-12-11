const express = require('express');
const router = express.Router();
const db = require('../db');  // Veritabanı bağlantısı
const multer = require('multer');
const path = require('path');

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
  

// Ürün Ekleme İşlemi
router.post('/products/add', multer({ dest: 'public/uploads/' }).single('image'), async (req, res) => {
  const { name, description, price, stock, category } = req.body;
  const image = req.file ? '/uploads/' + req.file.filename : null;  // Resim yolu

  try {
    const sql = `
      INSERT INTO products (name, description, price, stock, category_id, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await db.execute(sql, [name, description, price, stock, category, image]);
    res.redirect('/admin/products');  // Ürünler listesine yönlendir
  } catch (error) {
    console.error(error);
    res.status(500).send('Ürün eklenirken bir hata oluştu.');
  }
});

// Ürün Listesi
router.get('/products', async (req, res) => {
    try {
      const [products] = await db.execute('SELECT * FROM products');
      res.render('admin/products', { products });
    } catch (error) {
      console.error(error);
      res.status(500).send('Ürünler listelenirken bir hata oluştu.');
    }
  });
  

module.exports = router;
