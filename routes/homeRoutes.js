const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    // title'ı burada parametre olarak gönderiyoruz
    res.render('index', { title: 'E-Ticaret Anasayfa' });
  });
  


module.exports = router;
