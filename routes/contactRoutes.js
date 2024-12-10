const express = require('express');
const router = express.Router();

// İletişim sayfası
router.get('/', (req, res) => {
  res.render('contact');  // 'contact.ejs' sayfasını render eder
});

module.exports = router;
