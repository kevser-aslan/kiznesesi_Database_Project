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


// Sepeti boşaltma işlemi
router.post('/clear', async (req, res) => {
    const userId = req.session.user ? req.session.user.id : null; // Kullanıcı id'sini oturumdan al

    if (!userId) {
        // Eğer kullanıcı oturum açmamışsa hata gönder
        return res.status(401).send('Lütfen önce giriş yapınız.');
    }

    try {
        // Kullanıcının sepetindeki tüm ürünleri sil
        await db.execute('DELETE FROM cart WHERE user_id = ?', [userId]);

        // Başarı mesajı ve yönlendirme
        res.redirect('/cart');
    } catch (error) {
        console.error(error);
        res.status(500).send('Sepeti boşaltırken bir hata oluştu.');
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
  
// ***************************************************************************

// **Ödeme Sayfası**
router.get('/checkout', async (req, res) => {
    const userId = req.session.user.id;

    try {
        // Sepetteki ürünleri al
        const [cartItems] = await db.execute(
            `SELECT cart.id, products.name, products.price, cart.quantity 
            FROM cart 
            JOIN products ON cart.product_id = products.id
            WHERE cart.user_id = ?`,
            [userId]
        );

        // Kargo şirketlerini al
        const [shippingCompanies] = await db.execute('SELECT * FROM shipping_companies');

        // Ödeme yöntemlerini al
        const paymentMethods = ['Credit Card', 'Cash on Delivery', 'PayPal'];

        // Sepet toplamını hesapla
        const totalAmount = cartItems.reduce((total, item) => {
            return total + item.price * item.quantity;
        }, 0);

        res.render('checkout', { cartItems, totalAmount, shippingCompanies, paymentMethods });
    } catch (error) {
        console.error(error);
        res.status(500).send('Ödeme sayfası görüntülenirken bir hata oluştu.');
    }
});



router.post('/checkout/process', async (req, res) => {
    const userId = req.session.user.id; // Kullanıcı id'si
    const { address, shipping_company, payment_method } = req.body; // Adres, Kargo Şirketi ve Ödeme Yöntemi

    try {
        // Sepet verilerini al
        const [cartItems] = await db.execute(
            `SELECT cart.id, products.name, products.price, cart.quantity, products.id AS product_id
            FROM cart 
            JOIN products ON cart.product_id = products.id
            WHERE cart.user_id = ?`,
            [userId]
        );

        // Ürünlerin geçerli olup olmadığını kontrol et
        for (let item of cartItems) {
            if (!item.product_id) {
                return res.status(400).send('Geçersiz ürün bulundu.');
            }
        }

        // Siparişin toplam tutarını hesapla
        const totalAmount = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

        // Sipariş oluştur
        const [orderResult] = await db.execute(
            `INSERT INTO orders (user_id, total_amount, status, address, shipping_company_id, payment_method) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, totalAmount, 'pending', address, shipping_company, payment_method] // payment_method burada ekleniyor
        );

        // Siparişe ait ürünleri order_items tablosuna ekle
        const orderId = orderResult.insertId;
        for (let item of cartItems) {
            await db.execute(
                `INSERT INTO order_items (order_id, product_id, quantity, price) 
                VALUES (?, ?, ?, ?)`,
                [orderId, item.product_id, item.quantity, item.price]
            );
        }

        // Sepeti boşalt
        await db.execute('DELETE FROM cart WHERE user_id = ?', [userId]);

        // Kullanıcıyı sipariş detay sayfasına yönlendir
        res.redirect(`/cart/order/${orderId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Ödeme işlemi sırasında bir hata oluştu.');
    }
});



// Sipariş Detayı Görüntüleme
router.get('/order/:orderId', async (req, res) => {
    const orderId = req.params.orderId;
    const userId = req.session.user.id; // Kullanıcı id'si

    try {
        // Siparişi ve kargo durumunu al
        const [orderDetails] = await db.execute(
            `SELECT o.id, o.total_amount, o.status, o.address, o.shipping_status 
            FROM orders o
            WHERE o.id = ? AND o.user_id = ?`,
            [orderId, userId]
        );

      // Siparişin ürünlerini doğru bir şekilde alırken, name kullanılmalı
const [orderItems] = await db.execute(
    `SELECT oi.quantity, p.name AS product_name, p.price
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?`,
    [orderId]
);


        if (orderDetails.length === 0) {
            return res.status(404).send('Sipariş bulunamadı.');
        }

        // Sipariş detayları ve ürün bilgileri ile şablona veri gönder
        res.render('order-details', { order: orderDetails[0], orderItems: orderItems });

    } catch (error) {
        console.error(error);
        res.status(500).send('Sipariş detayı alınırken bir hata oluştu.');
    }
});


// **Kargo Durumu Güncelleme**
router.post('/order/update-shipping/:orderId', async (req, res) => {
    const orderId = req.params.orderId;
    const { shipping_status } = req.body; // Kargo durumu

    try {
        await db.execute(
            `UPDATE orders SET shipping_status = ? WHERE id = ?`,
            [shipping_status, orderId]
        );
        res.redirect(`/cart/order/${orderId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Kargo durumu güncellenirken bir hata oluştu.');
    }
});

router.get('/order-history', async (req, res) => {
    const userId = req.session.user.id;

    try {
        // Siparişleri al ve her siparişteki ürünleri de dahil et
        const [orders] = await db.execute(
            `SELECT o.id AS order_id, o.total_amount, o.status, o.order_date, oi.quantity, p.name AS product_name, p.price, p.image_url
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE o.user_id = ?
            ORDER BY o.order_date DESC`,
            [userId]
        );

        // Siparişlerin her birini gruplamak
        const groupedOrders = orders.reduce((acc, order) => {
            if (!acc[order.order_id]) {
                acc[order.order_id] = {
                    id: order.order_id,
                    total_amount: order.total_amount,
                    status: order.status,
                    order_date: order.order_date,
                    items: []
                };
            }
            acc[order.order_id].items.push({
                product_name: order.product_name,
                price: order.price,
                quantity: order.quantity,
                image_url: order.image_url
            });
            return acc;
        }, {});

        // Siparişleri array'e çevir
        const ordersList = Object.values(groupedOrders);

        res.render('order-history', { orders: ordersList });
    } catch (error) {
        console.error(error);
        res.status(500).send('Sipariş geçmişi görüntülenirken bir hata oluştu.');
    }
});




module.exports = router;
