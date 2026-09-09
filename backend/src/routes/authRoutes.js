const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { sanitizeLogin } = require('../middlewares/sanitizeInput');

// POST /api/auth/login  (sanitasi & validasi input sebelum masuk controller)
router.post('/login', sanitizeLogin, login);

// GET /api/auth/me  (protected)
router.get('/me', verifyToken, getMe);

module.exports = router;
