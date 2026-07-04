const express = require('express');
const router = express.Router();
const { register, login, getProfile, verifyOtp, resendOtp, updateProfile, logout } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/rateLimiter');

// Public routes (rate-limited)
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/resend-otp', authLimiter, resendOtp);

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Protected routes
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, upload.single('avatar'), updateProfile);
router.post('/logout', authMiddleware, logout);

module.exports = router;
