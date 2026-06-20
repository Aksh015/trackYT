const express = require('express');
const router = express.Router();
const { addChannel, getChannels, getChannelDetail, removeChannel } = require('../controllers/channelController');
const authMiddleware = require('../middlewares/authMiddleware');

// All channel routes require authentication
router.use(authMiddleware);

router.post('/', addChannel);
router.get('/', getChannels);
router.get('/:id', getChannelDetail);
router.delete('/:id', removeChannel);

module.exports = router;
