// Event types emitted by the change-detection system
const EVENT_TYPES = {
  NEW_VIDEO: 'NEW_VIDEO',
  TITLE_CHANGED: 'TITLE_CHANGED',
  THUMBNAIL_CHANGED: 'THUMBNAIL_CHANGED',
  CHANNEL_RENAMED: 'CHANNEL_RENAMED',
  PROFILE_PICTURE_CHANGED: 'PROFILE_PICTURE_CHANGED',
};

// Cron schedule expression — every hour at minute 0
const CRON_SCHEDULE_HOURLY = '0 * * * *';

// Cron schedule expression — every 15 minutes
const CRON_SCHEDULE_15MIN = '*/15 * * * *';

// Cron schedule expression — every day at midnight
const CRON_SCHEDULE_DAILY = '0 0 * * *';

// Cron schedule expression — daily for WebSub renewals
const CRON_SCHEDULE_WEBSUB_RENEW = '0 0 * * *';

// YouTube RSS feed base URL
const YT_RSS_BASE = 'https://www.youtube.com/feeds/videos.xml';

// YouTube Data API v3 base URL
const YT_API_BASE = 'https://www.googleapis.com/youtube/v3';

// Gemini API base URL
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Max videos to track per channel per poll
const MAX_RECENT_VIDEOS = 15;

// Regex patterns for parsing YouTube URLs
const YT_HANDLE_REGEX = /youtube\.com\/@([\w.-]+)/;
const YT_CHANNEL_ID_REGEX = /youtube\.com\/channel\/(UC[\w-]+)/;

module.exports = {
  EVENT_TYPES,
  CRON_SCHEDULE_HOURLY,
  CRON_SCHEDULE_15MIN,
  CRON_SCHEDULE_DAILY,
  CRON_SCHEDULE_WEBSUB_RENEW,
  YT_RSS_BASE,
  YT_API_BASE,
  GEMINI_API_BASE,
  MAX_RECENT_VIDEOS,
  YT_HANDLE_REGEX,
  YT_CHANNEL_ID_REGEX,
};
