const express = require('express');
const router = express.Router();
const db = require('../db');  // Veritabanı bağlantısı

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



// Sepetten Ürün Silme
router.post('/remove/:id', async (req, res) => {
    const cartItemId = req.params.id;

    try {
        // Sepet ürününü sil
        await db.execute('DELETE FROM cart WHERE id = ?', [cartItemId]);
        res.redirect('/cart');
    } catch (error) {
        console.error(error);
        res.status(500).send('Sepetten ürün silinirken bir hata oluştu.');
    }
});

// Sepet Ürün Miktarını Güncelleme
router.post('/update/:id', async (req, res) => {
    const cartItemId = req.params.id;
    const newQuantity = req.body.quantity;

    try {
        // Sepet ürün miktarını güncelle
        await db.execute('UPDATE cart SET quantity = ? WHERE id = ?', [newQuantity, cartItemId]);
        res.redirect('/cart');
    } catch (error) {
        console.error(error);
        res.status(500).send('Sepet ürünü güncellenirken bir hata oluştu.');
    }
});

// Sepeti Görüntüleme
router.get('/', async (req, res) => {
    const userId = req.session.user.id; // Kullanıcı id'si (oturumdan alınacak)

    try {
        // Sepetteki ürünleri al
        const [cartItems] = await db.execute(
            `SELECT cart.id, products.name, products.price, cart.quantity 
            FROM cart 
            JOIN products ON cart.product_id = products.id
            WHERE cart.user_id = ?`,
            [userId]
        );

        // Sepet toplamını hesapla
        const totalAmount = cartItems.reduce((total, item) => {
            return total + item.price * item.quantity;
        }, 0);

        res.render('product-cart', { cartItems, totalAmount });
    } catch (error) {
        console.error(error);
        res.status(500).send('Sepet görüntülenirken bir hata oluştu.');
    }
});

// Sepeti boşaltma işlemi
router.post('/clear', (req, res) => {
    req.session.cart = [];  // Sepetteki ürünleri sıfırlıyoruz
    res.redirect('/cart');  // Sepet sayfasına yönlendiriyoruz
  });
  

module.exports = router;
