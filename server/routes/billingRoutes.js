const express = require('express');
const { createCheckoutSession, handleWebhook, mockSuccess, mockDowngrade } = require('../controllers/billingController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Route to generate Stripe checkout session URL
router.post('/create-checkout-session', authMiddleware, createCheckoutSession);

// Fake webhook for mock checkout
router.post('/mock-success', authMiddleware, mockSuccess);

// Fake webhook for mock downgrade
router.post('/mock-downgrade', authMiddleware, mockDowngrade);

// Webhook must be raw, so it is mounted in server.js before express.json()
// We don't define the webhook route here to avoid middleware conflicts.

module.exports = router;
