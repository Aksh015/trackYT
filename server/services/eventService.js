const Event = require('../models/Event');
const logger = require('../utils/logger');
const cloudinaryService = require('./cloudinaryService');

/**
 * Create and persist a change event.
 */
const createEvent = async ({ channelId, userId, eventType, oldValue, newValue, metadata }) => {
  try {
    // For NEW_VIDEO events, use the video's actual publish time if available
    let detectedAt = new Date();
    if (eventType === 'NEW_VIDEO') {
      const publishedAt = metadata?.publishedAt || newValue?.publishedAt;
      if (publishedAt) {
        detectedAt = new Date(publishedAt);
      }
    }

    // Attempt to permanently archive thumbnails to Cloudinary
    if ((eventType === 'NEW_VIDEO' || eventType === 'THUMBNAIL_CHANGED') && newValue?.thumbnailURL) {
      const videoId = metadata?.videoId || newValue?.videoId;
      const archivedUrl = await cloudinaryService.uploadThumbnail(newValue.thumbnailURL, videoId);
      if (archivedUrl) {
        // Clone newValue so we don't mutate the original reference unpredictably
        newValue = { ...newValue, archivedThumbnailURL: archivedUrl };
      }
    }

    const event = await Event.create({
      channelId,
      userId,
      eventType,
      oldValue,
      newValue,
      metadata,
      detectedAt,
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

  if (eventType) {
    const types = Array.isArray(eventType) ? eventType : eventType.split(',');
    
    // When filtering specifically for new videos, only show last 24 hours
    if (types.includes('NEW_VIDEO')) {
      if (types.length === 1) {
        query.eventType = 'NEW_VIDEO';
        query.detectedAt = { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) };
      } else {
        query.$or = [
          { eventType: 'NEW_VIDEO', detectedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
          { eventType: { $in: types.filter(t => t !== 'NEW_VIDEO') } }
        ];
      }
    } else {
      query.eventType = { $in: types };
    }
  }

  if (channelId) {
    const ids = Array.isArray(channelId) ? channelId : channelId.split(',');
    query.channelId = { $in: ids };
  }

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
