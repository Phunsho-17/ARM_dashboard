const express = require('express');
const path = require('path');
const router = express.Router();
const authController = require('../controllers/authController');
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/auditlog.html'));
});

module.exports = router;
