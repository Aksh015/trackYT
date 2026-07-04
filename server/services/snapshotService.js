const Snapshot = require('../models/Snapshot');
const { EVENT_TYPES } = require('../utils/constants');
const youtubeService = require('./youtubeService');
const logger = require('../utils/logger');
const { hashThumbnailsBatch } = require('../utils/thumbnailHash');

/**
 * Take a fresh snapshot of a channel's current state.
 * Uses RSS (free) for video list + API for channel metadata.
 */
const takeSnapshot = async (channel) => {
  // Fetch current channel info (1 API unit)
  const channelInfo = await youtubeService.getChannelInfo(channel.channelId);

  // Fetch latest videos via RSS (free)
  let rssVideos = await youtubeService.getLatestVideosRSS(channel.channelId);

  // If RSS is empty/broken, fallback to API
  if (rssVideos.length === 0) {
    logger.info(`RSS returned 0 videos for ${channel.channelId}. Falling back to API...`);
    rssVideos = await youtubeService.getRecentVideosAPI(channel.channelId, 30);
  }

  // Get previous snapshot to carry over tracked videos
  const previousSnapshot = await Snapshot.findOne({ channelId: channel.channelId }).sort({ takenAt: -1 }).lean();
  const prevVideoIds = previousSnapshot?.recentVideoIds || [];
  const rssVideoIds = rssVideos.map((v) => v.videoId).filter(Boolean);

  // Combine newly discovered videos with previously tracked videos, keeping up to 50
  const allVideoIds = Array.from(new Set([...rssVideoIds, ...prevVideoIds])).slice(0, 50);

  const videoDetails = {};
  const recentVideoIds = [];

  if (allVideoIds.length > 0) {
    recentVideoIds.push(...allVideoIds);

    // Batch fetch from API (1 unit for up to 50 IDs)
    const detailedVideos = await youtubeService.getVideoDetails(allVideoIds);

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
      if (recentVideoIds.includes(rssVideo.videoId) && !videoDetails[rssVideo.videoId]) {
        videoDetails[rssVideo.videoId] = {
          title: rssVideo.title,
          thumbnailURL: rssVideo.thumbnailURL,
        };
      }
    }

    // Hash all thumbnail images to detect content-level changes
    // (YouTube reuses the same URL when a creator swaps a thumbnail)
    try {
      const hashes = await hashThumbnailsBatch(videoDetails);
      for (const [videoId, hash] of Object.entries(hashes)) {
        if (videoDetails[videoId] && hash) {
          videoDetails[videoId].thumbnailHash = hash;
        }
      }
    } catch (err) {
      logger.warn(`Thumbnail hashing failed, skipping: ${err.message}`);
    }
  }

  const latestVideoId = rssVideoIds[0] || prevVideoIds[0] || '';
  const latestVideo = latestVideoId
    ? {
        videoId: latestVideoId,
        title: videoDetails[latestVideoId]?.title || '',
        thumbnailURL: videoDetails[latestVideoId]?.thumbnailURL || '',
        publishedAt: videoDetails[latestVideoId]?.publishedAt || null,
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
    
    // BUG FIX: Prevent old videos from triggering NEW_VIDEO events when they
    // cycle into the snapshot (e.g. due to RSS vs API pagination differences).
    let isActuallyNew = true;
    if (details.publishedAt) {
      const publishedDate = new Date(details.publishedAt);
      const daysSincePublish = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePublish > 3) {
        isActuallyNew = false;
      }
    }

    if (isActuallyNew) {
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
    } else {
      logger.debug(`Skipping NEW_VIDEO event for ${videoId} because it was published > 3 days ago.`);
    }
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

      // 3. Detect thumbnail changes via content hash
      // URL comparison is unreliable — YouTube reuses the same URL on thumbnail swaps
      const oldHash = prevDetails[videoId].thumbnailHash;
      const newHash = currDetails[videoId].thumbnailHash;
      const oldThumb = prevDetails[videoId].thumbnailURL;
      const newThumb = currDetails[videoId].thumbnailURL;

      const thumbnailChanged =
        // Primary: compare content hashes (reliable)
        (oldHash && newHash && oldHash !== newHash) ||
        // Fallback: if no hashes, compare URLs (may catch resolution changes)
        (!oldHash && !newHash && oldThumb && newThumb && oldThumb !== newThumb);

      if (thumbnailChanged) {
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
