const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', { title: 'E-Ticaret Anasayfa' });
});

module.exports = router;
