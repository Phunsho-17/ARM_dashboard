const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');

// API route to seed demo users
router.post('/seed-users', auth.seedDemoUsers);

// Simulated login/logout endpoints for demo
router.post('/login', auth.login);
router.post('/logout', auth.logout);

// Get all users (for table display)
router.get('/users', auth.getAllUsers);

module.exports = router;
