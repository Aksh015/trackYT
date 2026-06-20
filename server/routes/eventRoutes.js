const express = require('express');
const router = express.Router();
const { getEvents, getChannelEvents } = require('../controllers/eventController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', getEvents);
router.get('/channel/:channelId', getChannelEvents);

module.exports = router;
