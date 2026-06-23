const Snapshot = require('../models/Snapshot');
const { EVENT_TYPES } = require('../utils/constants');
const youtubeService = require('./youtubeService');
const logger = require('../utils/logger');

/**
 * Take a fresh snapshot of a channel's current state.
 * Uses RSS (free) for video list + API for channel metadata.
 */
const takeSnapshot = async (channel) => {
  // Fetch current channel info (1 API unit)
  const channelInfo = await youtubeService.getChannelInfo(channel.channelId);

  // Fetch latest videos via RSS (free)
  const rssVideos = await youtubeService.getLatestVideosRSS(channel.channelId);

  // Build video details map
  const videoDetails = {};
  const recentVideoIds = [];

  // If we have RSS videos, also get detailed info from API for accurate titles/thumbnails
  if (rssVideos.length > 0) {
    const videoIds = rssVideos.map((v) => v.videoId).filter(Boolean);
    recentVideoIds.push(...videoIds);

    // Batch fetch from API (1 unit for up to 50 IDs)
    const detailedVideos = await youtubeService.getVideoDetails(videoIds);

    for (const video of detailedVideos) {
      videoDetails[video.videoId] = {
        title: video.title,
        thumbnailURL: video.thumbnailURL,
        views: video.views || 0,
        likes: video.likes || 0,
        comments: video.comments || 0,
        publishedAt: video.publishedAt ? new Date(video.publishedAt) : null,
      };
    }

    // Fallback: fill in any missing from RSS data
    for (const rssVideo of rssVideos) {
      if (!videoDetails[rssVideo.videoId]) {
        videoDetails[rssVideo.videoId] = {
          title: rssVideo.title,
          thumbnailURL: rssVideo.thumbnailURL,
        };
      }
    }
  }

  const latestVideo = rssVideos[0]
    ? {
        videoId: rssVideos[0].videoId,
        title: videoDetails[rssVideos[0].videoId]?.title || rssVideos[0].title,
        thumbnailURL: videoDetails[rssVideos[0].videoId]?.thumbnailURL || rssVideos[0].thumbnailURL,
        publishedAt: rssVideos[0].publishedAt ? new Date(rssVideos[0].publishedAt) : null,
      }
    : { videoId: '', title: '', thumbnailURL: '', publishedAt: null };

  const snapshot = await Snapshot.create({
    channelId: channel.channelId,
    channelName: channelInfo.channelName,
    profilePicURL: channelInfo.profilePicURL,
    description: channelInfo.description,
    recentVideoIds,
    latestVideo,
    videoDetails,
    takenAt: new Date(),
  });

  logger.debug(`Snapshot taken for ${channel.channelName} (${channel.channelId})`);
  return snapshot;
};

/**
 * Get the most recent snapshot for a channel.
 */
const getLatestSnapshot = async (channelId) => {
  return Snapshot.findOne({ channelId }).sort({ takenAt: -1 }).lean();
};

/**
 * Compare two snapshots and return an array of detected changes.
 * Each change is { eventType, oldValue, newValue, metadata }.
 */
const diffSnapshots = (previous, current) => {
  if (!previous) return []; // first snapshot, nothing to diff
  const changes = [];

  // 1. Detect new videos
  const prevVideoIds = new Set(previous.recentVideoIds || []);
  const newVideoIds = (current.recentVideoIds || []).filter((id) => !prevVideoIds.has(id));

  for (const videoId of newVideoIds) {
    const details = current.videoDetails?.get?.(videoId)
      || current.videoDetails?.[videoId]
      || {};
    changes.push({
      eventType: EVENT_TYPES.NEW_VIDEO,
      oldValue: null,
      newValue: {
        videoId,
        title: details.title || '',
        thumbnailURL: details.thumbnailURL || '',
        publishedAt: details.publishedAt || null,
      },
      metadata: { videoId, publishedAt: details.publishedAt || null },
    });
  }

  // 2. Detect title changes on existing videos
  const prevDetails = previous.videoDetails instanceof Map
    ? Object.fromEntries(previous.videoDetails)
    : previous.videoDetails || {};
  const currDetails = current.videoDetails instanceof Map
    ? Object.fromEntries(current.videoDetails)
    : current.videoDetails || {};

  for (const videoId of Object.keys(currDetails)) {
    if (prevDetails[videoId] && currDetails[videoId]) {
      const oldTitle = prevDetails[videoId].title;
      const newTitle = currDetails[videoId].title;
      if (oldTitle && newTitle && oldTitle !== newTitle) {
        changes.push({
          eventType: EVENT_TYPES.TITLE_CHANGED,
          oldValue: { title: oldTitle },
          newValue: { title: newTitle },
          metadata: {
            videoId,
            thumbnailURL: currDetails[videoId].thumbnailURL || '',
          },
        });
      }

      // 3. Detect thumbnail changes
      const oldThumb = prevDetails[videoId].thumbnailURL;
      const newThumb = currDetails[videoId].thumbnailURL;
      if (oldThumb && newThumb && oldThumb !== newThumb) {
        changes.push({
          eventType: EVENT_TYPES.THUMBNAIL_CHANGED,
          oldValue: { thumbnailURL: oldThumb },
          newValue: { thumbnailURL: newThumb },
          metadata: {
            videoId,
            title: currDetails[videoId].title || '',
          },
        });
      }
    }
  }

  // 4. Detect channel rename
  if (
    previous.channelName &&
    current.channelName &&
    previous.channelName !== current.channelName
  ) {
    changes.push({
      eventType: EVENT_TYPES.CHANNEL_RENAMED,
      oldValue: { channelName: previous.channelName },
      newValue: { channelName: current.channelName },
      metadata: {},
    });
  }

  // 5. Detect profile picture change
  if (
    previous.profilePicURL &&
    current.profilePicURL &&
    previous.profilePicURL !== current.profilePicURL
  ) {
    changes.push({
      eventType: EVENT_TYPES.PROFILE_PICTURE_CHANGED,
      oldValue: { profilePicURL: previous.profilePicURL },
      newValue: { profilePicURL: current.profilePicURL },
      metadata: {},
    });
  }

  return changes;
};

module.exports = { takeSnapshot, getLatestSnapshot, diffSnapshots };
