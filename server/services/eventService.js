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
    if (eventType === 'NEW_VIDEO' && newValue?.thumbnailURL) {
      const videoId = metadata?.videoId || newValue?.videoId;
      const archivedUrl = await cloudinaryService.uploadThumbnail(newValue.thumbnailURL, videoId);
      if (archivedUrl) {
        newValue = { ...newValue, archivedThumbnailURL: archivedUrl };
      }
    }

    // For thumbnail changes, archive both old and new thumbnails.
    // IMPORTANT: By the time we detect the change, YouTube's CDN already serves
    // the NEW image at the old URL. So we can't re-download the old thumbnail.
    // Instead, we grab the previously archived Cloudinary URL from the NEW_VIDEO event.
    if (eventType === 'THUMBNAIL_CHANGED') {
      const videoId = metadata?.videoId;
      const timestamp = Date.now();

      // Look up the previously archived old thumbnail from Cloudinary
      if (videoId) {
        // Try the most recent event first (THUMBNAIL_CHANGED or NEW_VIDEO)
        const previousEvent = await Event.findOne({
          userId,
          'metadata.videoId': videoId,
          eventType: { $in: ['NEW_VIDEO', 'THUMBNAIL_CHANGED'] },
        }).sort({ detectedAt: -1 }).lean();

        let previouslyArchivedUrl =
          previousEvent?.newValue?.archivedThumbnailURL ||
          previousEvent?.newValue?.thumbnailURL;

        // Validate the URL is actually a Cloudinary archive (not a YouTube CDN URL
        // that was incorrectly set by a previous bug). YouTube CDN URLs are useless
        // here because they already serve the NEW image by the time we detect changes.
        const isCloudinaryUrl = (url) => url && (
          url.includes('cloudinary.com') || url.includes('res.cloudinary')
        );

        if (!isCloudinaryUrl(previouslyArchivedUrl)) {
          // Fallback: search for ANY event for this video that has a valid
          // Cloudinary archived URL (e.g., an older THUMBNAIL_CHANGED event)
          const archivedEvent = await Event.findOne({
            'metadata.videoId': videoId,
            eventType: { $in: ['NEW_VIDEO', 'THUMBNAIL_CHANGED'] },
            'newValue.archivedThumbnailURL': { $regex: /cloudinary/ },
          }).sort({ detectedAt: -1 }).lean();

          if (archivedEvent?.newValue?.archivedThumbnailURL) {
            previouslyArchivedUrl = archivedEvent.newValue.archivedThumbnailURL;
          } else {
            previouslyArchivedUrl = null;
          }
        }

        if (previouslyArchivedUrl) {
          oldValue = { ...oldValue, archivedThumbnailURL: previouslyArchivedUrl };
        }
      }

      // Upload the NEW thumbnail to Cloudinary with a unique ID
      if (newValue?.thumbnailURL) {
        const newArchivedUrl = await cloudinaryService.uploadThumbnail(
          newValue.thumbnailURL,
          `${videoId}_${timestamp}`
        );
        if (newArchivedUrl) {
          newValue = { ...newValue, archivedThumbnailURL: newArchivedUrl };
        }
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
