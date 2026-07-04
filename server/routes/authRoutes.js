const express = require('express');
const router = express.Router();
const { register, login, getProfile, verifyOtp, resendOtp } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/rateLimiter');

// Public routes (rate-limited)
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/resend-otp', authLimiter, resendOtp);

// Protected route
router.get('/profile', authMiddleware, getProfile);

module.exports = router;
