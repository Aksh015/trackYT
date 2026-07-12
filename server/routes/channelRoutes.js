const express = require('express');
const router = express.Router();
const { addChannel, getChannels, getChannelDetail, removeChannel } = require('../controllers/channelController');
const { getVideoHistory } = require('../controllers/videoController');
const authMiddleware = require('../middlewares/authMiddleware');
const { refreshLimiter } = require('../middlewares/rateLimiter');
const { monitorUserChannels } = require('../jobs/channelMonitor');
const logger = require('../utils/logger');

// All channel routes require authentication
router.use(authMiddleware);

// Manual refresh — triggers the channel monitor on demand
// Must be before /:id so 'refresh' isn't treated as a channel ID
router.post('/refresh', refreshLimiter, async (req, res) => {
  try {
    if (req.user.planType !== 'PREMIUM') {
      return res.status(403).json({ success: false, message: 'Premium required for manual refresh' });
    }
    
    logger.info(`Manual refresh triggered by user ${req.user._id}`);
    await monitorUserChannels(req.user._id);
    res.json({ success: true, status: 'scan_complete' });
  } catch (error) {
    logger.error('Manual refresh failed:', error.message);
    res.status(500).json({ success: false, status: 'scan_failed' });
  }
});

router.post('/', addChannel);
router.get('/', getChannels);
router.get('/:id', getChannelDetail);
router.delete('/:id', removeChannel);

// Video specific routes within a channel
router.get('/:channelId/videos/:videoId/history', getVideoHistory);

module.exports = router;

