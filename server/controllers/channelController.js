const Channel = require('../models/Channel');
const Event = require('../models/Event');
const { parseChannelURL } = require('../utils/validators');
const { EVENT_TYPES } = require('../utils/constants');
const youtubeService = require('../services/youtubeService');
const snapshotService = require('../services/snapshotService');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

/**
 * POST /api/channels
 * Add a new YouTube channel to monitor.
 */
const addChannel = async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Channel URL is required.',
      });
    }

    // Enforce FREE plan channel limit
    const isPro = req.user.planType?.toUpperCase() === 'PREMIUM';
    if (!isPro) {
      const currentCount = await Channel.countDocuments({ userId: req.user._id });
      if (currentCount >= 3) {
        return res.status(403).json({
          success: false,
          message: 'Free plan limit reached (3 channels). Please upgrade to add more channels.',
        });
      }
    }

    // Parse the YouTube URL
    const parsed = parseChannelURL(url);
    if (!parsed) {
      return res.status(400).json({
        success: false,
        message: 'Invalid YouTube channel URL. Use format: https://youtube.com/@handle or https://youtube.com/channel/UC...',
      });
    }

    let channelData;

    if (parsed.type === 'handle') {
      // Resolve handle to channelId (costs 100 API units)
      const resolvedData = await youtubeService.resolveHandle(parsed.value);
      // Fetch full details to get un-truncated description (costs 1 API unit)
      channelData = await youtubeService.getChannelInfo(resolvedData.channelId);
      channelData.channelHandle = `@${parsed.value}`;
    } else {
      // Direct channelId — just fetch info (costs 1 API unit)
      channelData = await youtubeService.getChannelInfo(parsed.value);
      channelData.channelHandle = '';
    }

    // Check if already tracking this channel
    const existing = await Channel.findOne({
      userId: req.user._id,
      channelId: channelData.channelId,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You are already monitoring this channel.',
      });
    }

    // Create the channel record
    const channel = await Channel.create({
      userId: req.user._id,
      channelId: channelData.channelId,
      channelName: channelData.channelName,
      channelHandle: channelData.channelHandle,
      channelURL: url.trim(),
      profilePicURL: channelData.profilePicURL,
      description: channelData.description || '',
      lastCheckedAt: new Date(),
    });

    // Take initial snapshot (establishes baseline for future diffs)
    try {
      const currentSnapshot = await snapshotService.takeSnapshot(channel);
      logger.info(`Initial snapshot taken for ${channel.channelName}`);

      // Backfill recent videos from the snapshot (published in the last 3 days)
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const recentVideos = [];
      if (currentSnapshot && currentSnapshot.videoDetails) {
        // Handle both Map (if using mongoose Map) and plain object
        const detailsObj = currentSnapshot.videoDetails instanceof Map 
          ? Object.fromEntries(currentSnapshot.videoDetails) 
          : currentSnapshot.videoDetails;

        for (const videoId of currentSnapshot.recentVideoIds || []) {
          const details = detailsObj[videoId];
          if (details && details.publishedAt && new Date(details.publishedAt) >= threeDaysAgo) {
            recentVideos.push({
              videoId,
              ...details
            });
          }
        }
      }

      if (recentVideos.length > 0) {
        // Use eventService.createEvent instead of Event.insertMany
        // so that the Cloudinary thumbnail upload logic gets triggered!
        const eventService = require('../services/eventService');
        
        for (const v of recentVideos) {
          await eventService.createEvent({
            userId: req.user._id,
            channelId: channel.channelId,
            eventType: EVENT_TYPES.NEW_VIDEO,
            oldValue: null,
            newValue: {
              videoId: v.videoId,
              title: v.title,
              thumbnailURL: v.thumbnailURL,
              publishedAt: v.publishedAt,
            },
            metadata: { 
              videoId: v.videoId,
              publishedAt: v.publishedAt
            }
          });
        }
        logger.info(`Backfilled ${recentVideos.length} NEW_VIDEO events for ${channel.channelName} to Cloudinary`);
      }

    } catch (snapError) {
      logger.warn(`Initial snapshot failed for ${channel.channelName}:`, snapError.message);
      // Non-fatal: channel is still added, snapshot will be taken on next cron run
    }

    res.status(201).json({
      success: true,
      message: `Now monitoring ${channel.channelName}`,
      data: { channel },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/channels
 * List all channels the user is monitoring.
 */
const getChannels = async (req, res, next) => {
  try {
    const channels = await Channel.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: { channels, total: channels.length },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/channels/:id
 * Get detailed info for a single channel.
 */
const getChannelDetail = async (req, res, next) => {
  try {
    const channel = await Channel.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).lean();

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found.',
      });
    }

    // Get the latest snapshot for additional context
    const latestSnapshot = await snapshotService.getLatestSnapshot(channel.channelId);

    res.json({
      success: true,
      data: {
        channel,
        latestSnapshot,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/channels/:id
 * Stop monitoring a channel and remove associated data.
 */
const removeChannel = async (req, res, next) => {
  try {
    const channel = await Channel.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found.',
      });
    }

    // Clean up associated data in background (non-blocking)
    const Snapshot = require('../models/Snapshot');
    const Event = require('../models/Event');
    const AIReport = require('../models/AIReport');

    Promise.all([
      Snapshot.deleteMany({ channelId: channel.channelId }),
      Event.deleteMany({ channelId: channel.channelId, userId: req.user._id }),
      AIReport.deleteMany({ channelId: channel.channelId, userId: req.user._id }),
    ]).catch((err) => logger.error('Cleanup error:', err.message));

    res.json({
      success: true,
      message: `Stopped monitoring ${channel.channelName}`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { addChannel, getChannels, getChannelDetail, removeChannel };
