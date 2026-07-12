const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// WebSub endpoints
router.get('/youtube', webhookController.verifyIntent);
router.post('/youtube', express.text({ type: 'application/atom+xml' }), webhookController.handleNotification);

module.exports = router;
