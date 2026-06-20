const Event = require('../models/Event');
const logger = require('../utils/logger');

/**
 * Create and persist a change event.
 */
const createEvent = async ({ channelId, userId, eventType, oldValue, newValue, metadata }) => {
  try {
    const event = await Event.create({
      channelId,
      userId,
      eventType,
      oldValue,
      newValue,
      metadata,
      detectedAt: new Date(),
    });

    logger.info(`Event created: ${eventType} for channel ${channelId}`);
    return event;
  } catch (error) {
    logger.error(`Failed to create event:`, error.message);
    throw error;
  }
};

/**
 * Get events for a user's channels with pagination.
 */
const getUserEvents = async (userId, { page = 1, limit = 20, eventType, channelId } = {}) => {
  const query = { userId };

  if (eventType) query.eventType = eventType;
  if (channelId) query.channelId = channelId;

  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    Event.find(query)
      .sort({ detectedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Event.countDocuments(query),
  ]);

  return {
    events,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get events for a specific channel.
 */
const getChannelEvents = async (channelId, { page = 1, limit = 50 } = {}) => {
  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    Event.find({ channelId })
      .sort({ detectedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Event.countDocuments({ channelId }),
  ]);

  return { events, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

module.exports = { createEvent, getUserEvents, getChannelEvents };
