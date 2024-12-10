const express = require('express');
const router = express.Router();

// About sayfası
router.get('/', (req, res) => {
  res.render('about');  // 'about.ejs' sayfasını render eder
});

module.exports = router;
