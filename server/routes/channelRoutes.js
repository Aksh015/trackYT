const express = require('express');
const router = express.Router();
const { addChannel, getChannels, getChannelDetail, removeChannel } = require('../controllers/channelController');
const { getVideoHistory } = require('../controllers/videoController');
const authMiddleware = require('../middlewares/authMiddleware');

// All channel routes require authentication
router.use(authMiddleware);

router.post('/', addChannel);
router.get('/', getChannels);
router.get('/:id', getChannelDetail);
router.delete('/:id', removeChannel);

// Video specific routes within a channel
router.get('/:channelId/videos/:videoId/history', getVideoHistory);

module.exports = router;
