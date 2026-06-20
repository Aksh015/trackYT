const express = require('express');
const router = express.Router();
const { getAnalytics, getAISummary } = require('../controllers/analyticsController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/:channelId', getAnalytics);
router.get('/:channelId/summary', getAISummary);

module.exports = router;
