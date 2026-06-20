const axios = require('axios');
const { parseString } = require('xml2js');
const { promisify } = require('util');
const logger = require('../utils/logger');
const { YT_API_BASE, YT_RSS_BASE, MAX_RECENT_VIDEOS } = require('../utils/constants');

const parseXML = promisify(parseString);

/**
 * Resolve a YouTube @handle to a channelId using the Data API v3.
 * Costs 100 quota units (search.list).
 */
const resolveHandle = async (handle) => {
  try {
    const response = await axios.get(`${YT_API_BASE}/search`, {
      params: {
        part: 'snippet',
        q: `@${handle}`,
        type: 'channel',
        maxResults: 1,
        key: process.env.YOUTUBE_API_KEY,
      },
    });

    const items = response.data.items;
    if (!items || items.length === 0) {
      throw new Error(`No channel found for handle @${handle}`);
    }

    return {
      channelId: items[0].id.channelId,
      channelName: items[0].snippet.channelTitle,
      description: items[0].snippet.description,
      profilePicURL: items[0].snippet.thumbnails?.high?.url
        || items[0].snippet.thumbnails?.default?.url
        || '',
    };
  } catch (error) {
    logger.error(`Failed to resolve handle @${handle}:`, error.message);
    throw error;
  }
};

/**
 * Get channel details by channelId.
 * Costs 1 quota unit (channels.list).
 */
const getChannelInfo = async (channelId) => {
  try {
    const response = await axios.get(`${YT_API_BASE}/channels`, {
      params: {
        part: 'snippet,statistics,contentDetails',
        id: channelId,
        key: process.env.YOUTUBE_API_KEY,
      },
    });

    const items = response.data.items;
    if (!items || items.length === 0) {
      throw new Error(`No channel found for ID ${channelId}`);
    }

    const channel = items[0];
    return {
      channelId: channel.id,
      channelName: channel.snippet.title,
      description: channel.snippet.description,
      profilePicURL: channel.snippet.thumbnails?.high?.url
        || channel.snippet.thumbnails?.default?.url
        || '',
      subscriberCount: channel.statistics?.subscriberCount || '0',
      videoCount: channel.statistics?.videoCount || '0',
      uploadsPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads || '',
    };
  } catch (error) {
    logger.error(`Failed to get channel info for ${channelId}:`, error.message);
    throw error;
  }
};

/**
 * Fetch latest videos from YouTube RSS feed.
 * FREE — no quota cost, returns up to 15 recent videos.
 */
const getLatestVideosRSS = async (channelId) => {
  try {
    const response = await axios.get(YT_RSS_BASE, {
      params: { channel_id: channelId },
      timeout: 10000,
    });

    const result = await parseXML(response.data);
    const entries = result.feed?.entry || [];

    return entries.slice(0, MAX_RECENT_VIDEOS).map((entry) => ({
      videoId: entry['yt:videoId']?.[0] || '',
      title: entry.title?.[0] || '',
      publishedAt: entry.published?.[0] || '',
      updatedAt: entry.updated?.[0] || '',
      // RSS doesn't provide thumbnail URLs directly — we construct them
      thumbnailURL: entry['media:group']?.[0]?.['media:thumbnail']?.[0]?.$?.url
        || `https://i.ytimg.com/vi/${entry['yt:videoId']?.[0]}/hqdefault.jpg`,
    }));
  } catch (error) {
    logger.error(`Failed to fetch RSS for channel ${channelId}:`, error.message);
    return [];
  }
};

/**
 * Fetch recent videos using the Data API (via the Uploads playlist).
 * Costs 1 quota unit. Returns up to 50 videos. This bypasses the 15-video RSS limit.
 */
const getRecentVideosAPI = async (channelId, daysAgo = 2) => {
  if (!channelId) return [];
  
  // YouTube hack: the "Uploads" playlist ID is just the channel ID with "UU" instead of "UC"
  const uploadsPlaylistId = channelId.replace(/^UC/, 'UU');
  
  try {
    const response = await axios.get(`${YT_API_BASE}/playlistItems`, {
      params: {
        part: 'snippet',
        playlistId: uploadsPlaylistId,
        maxResults: 50,
        key: process.env.YOUTUBE_API_KEY,
      },
    });

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

    const items = response.data.items || [];
    const recentVideos = [];

    for (const item of items) {
      const publishedAt = new Date(item.snippet.publishedAt);
      if (publishedAt >= cutoffDate) {
        recentVideos.push({
          videoId: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          publishedAt: item.snippet.publishedAt,
          thumbnailURL: item.snippet.thumbnails?.maxres?.url
            || item.snippet.thumbnails?.high?.url
            || item.snippet.thumbnails?.default?.url
            || '',
        });
      }
    }

    return recentVideos;
  } catch (error) {
    logger.error(`Failed to fetch recent videos via API:`, error.message);
    return [];
  }
};

/**
 * Get video details by video IDs (batch).
 * Costs 1 quota unit per call, supports up to 50 IDs per call.
 */
const getVideoDetails = async (videoIds) => {
  if (!videoIds || videoIds.length === 0) return [];

  try {
    const response = await axios.get(`${YT_API_BASE}/videos`, {
      params: {
        part: 'snippet,statistics',
        id: videoIds.join(','),
        key: process.env.YOUTUBE_API_KEY,
      },
    });

    return (response.data.items || []).map((video) => ({
      videoId: video.id,
      title: video.snippet.title,
      thumbnailURL: video.snippet.thumbnails?.maxres?.url
        || video.snippet.thumbnails?.high?.url
        || video.snippet.thumbnails?.default?.url
        || '',
      views: parseInt(video.statistics?.viewCount || '0', 10),
      likes: parseInt(video.statistics?.likeCount || '0', 10),
      comments: parseInt(video.statistics?.commentCount || '0', 10),
      publishedAt: video.snippet.publishedAt,
      channelTitle: video.snippet.channelTitle,
    }));
  } catch (error) {
    logger.error(`Failed to get video details:`, error.message);
    return [];
  }
};

module.exports = {
  resolveHandle,
  getChannelInfo,
  getLatestVideosRSS,
  getRecentVideosAPI,
  getVideoDetails,
};
