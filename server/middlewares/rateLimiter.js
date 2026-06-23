const rateLimit = require('express-rate-limit');

// General API rate limiter — 500 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // Increased for heavy dashboard usage
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

// Strict limiter for auth endpoints — 50 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Increased to prevent locking out during testing
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.',
  },
});

// Strict limiter for manual refresh — 1 per 2 minutes per IP (protects YouTube API quota)
const refreshLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'rate_limited',
  },
});

module.exports = { apiLimiter, authLimiter, refreshLimiter };
