const express = require('express');
const router = express.Router();
const db = require('../db');

// Kaydedilen karşılaştırmalar listesi
router.get('/saved', async (req, res) => {
    try {
        // comparisons tablosundaki verilerle ürün bilgilerini birleştiriyoruz
        const [comparisons] = await db.execute(`
            SELECT 
                c.id,
                c.created_at,
                p1.name AS product1_name,
                p2.name AS product2_name
            FROM comparisons c
            JOIN products p1 ON c.product1_id = p1.id
            JOIN products p2 ON c.product2_id = p2.id
            ORDER BY c.created_at DESC
        `);

        res.render('savedComparisons', { comparisons });
    } catch (error) {
        console.error(error);
        res.status(500).send('Kaydedilen karşılaştırmalar alınırken bir hata oluştu.');
    }
});

// Kaydedilen karşılaştırma detaylarını gösterme
router.get('/:id', async (req, res) => {
    const comparisonId = req.params.id;

    try {
        // İlgili karşılaştırma ve ürün bilgilerini alıyoruz
        const [comparison] = await db.execute(`
            SELECT 
                c.id,
                p1.name AS product1_name,
                p1.description AS product1_description,
                p1.price AS product1_price,
                p1.image_url AS product1_image,
                p2.name AS product2_name,
                p2.description AS product2_description,
                p2.price AS product2_price,
                p2.image_url AS product2_image
            FROM comparisons c
            JOIN products p1 ON c.product1_id = p1.id
            JOIN products p2 ON c.product2_id = p2.id
            WHERE c.id = ?
        `, [comparisonId]);

        if (comparison.length === 0) {
            return res.status(404).send('Karşılaştırma bulunamadı.');
        }

        res.render('comparisonDetails', { comparison: comparison[0] });
    } catch (error) {
        console.error(error);
        res.status(500).send('Karşılaştırma detayları alınırken bir hata oluştu.');
    }
});

module.exports = router;
