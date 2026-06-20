const { YT_HANDLE_REGEX, YT_CHANNEL_ID_REGEX } = require('./constants');

/**
 * Parse a YouTube channel URL and extract the handle or channel ID.
 * Supports formats:
 *   https://www.youtube.com/@MrBeast
 *   https://youtube.com/@MrBeast
 *   https://www.youtube.com/channel/UCX6OQ3DkcsbYNE6H8uQQuVA
 *
 * Returns { type: 'handle' | 'channelId', value: string } or null
 */
const parseChannelURL = (url) => {
  if (!url || typeof url !== 'string') return null;

  const cleanURL = url.trim();

  const handleMatch = cleanURL.match(YT_HANDLE_REGEX);
  if (handleMatch) {
    return { type: 'handle', value: handleMatch[1] };
  }

  const channelIdMatch = cleanURL.match(YT_CHANNEL_ID_REGEX);
  if (channelIdMatch) {
    return { type: 'channelId', value: channelIdMatch[1] };
  }

  return null;
};

/**
 * Validate email format.
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength.
 * At least 6 characters.
 */
const isValidPassword = (password) => {
  return typeof password === 'string' && password.length >= 6;
};

/**
 * Validate a username.
 * 3-30 chars, alphanumeric + underscores.
 */
const isValidUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
};

module.exports = {
  parseChannelURL,
  isValidEmail,
  isValidPassword,
  isValidUsername,
};
