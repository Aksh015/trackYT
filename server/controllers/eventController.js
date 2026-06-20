const eventService = require('../services/eventService');

/**
 * GET /api/events
 * Get events feed for the authenticated user.
 * Query params: page, limit, eventType, channelId
 */
const getEvents = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, eventType, channelId } = req.query;

    const result = await eventService.getUserEvents(req.user._id, {
      page: parseInt(page),
      limit: parseInt(limit),
      eventType,
      channelId,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/events/channel/:channelId
 * Get events for a specific channel.
 */
const getChannelEvents = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const result = await eventService.getChannelEvents(req.params.channelId, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getEvents, getChannelEvents };
