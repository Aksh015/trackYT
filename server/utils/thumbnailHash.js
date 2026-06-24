const crypto = require('crypto');
const axios = require('axios');
const logger = require('./logger');

/**
 * Download a thumbnail image and return its MD5 hash.
 * YouTube reuses the same URL when a creator swaps a thumbnail,
 * so we must hash the actual image bytes to detect changes.
 *
 * Returns '' on failure so callers can gracefully fall back.
 */
const hashThumbnail = async (url) => {
  if (!url) return '';

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        // Bypass any CDN/edge cache to get the freshest copy
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });

    const hash = crypto.createHash('md5').update(Buffer.from(response.data)).digest('hex');
    return hash;
  } catch (error) {
    logger.warn(`Failed to hash thumbnail at ${url}: ${error.message}`);
    return '';
  }
};

/**
 * Hash thumbnails for a batch of videos.
 * Accepts an object { videoId: { thumbnailURL, ... } }
 * Returns { videoId: hashString }
 */
const hashThumbnailsBatch = async (videoDetailsMap) => {
  const entries = Object.entries(videoDetailsMap);
  const hashes = {};

  // Process in parallel with a concurrency limit of 10
  const BATCH_SIZE = 10;
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async ([videoId, details]) => {
        const hash = await hashThumbnail(details.thumbnailURL);
        return { videoId, hash };
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        hashes[result.value.videoId] = result.value.hash;
      }
    }
  }

  return hashes;
};

module.exports = { hashThumbnail, hashThumbnailsBatch };
