const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

// Check if Cloudinary is configured (either by CLOUDINARY_URL or direct config)
const isConfigured = () => {
  const config = cloudinary.config();
  return Boolean(config.cloud_name && config.api_key && config.api_secret);
};

/**
 * Upload an image URL to Cloudinary for permanent archiving.
 * 
 * @param {string} imageUrl - The source URL of the image (e.g. YouTube thumbnail)
 * @param {string} videoId - The YouTube video ID (used for naming)
 * @returns {Promise<string|null>} The permanent Cloudinary secure_url, or null if failed/unconfigured
 */
const uploadThumbnail = async (imageUrl, videoId) => {
  if (!imageUrl) return null;
  
  if (!isConfigured()) {
    logger.warn('Cloudinary is not configured. Skipping thumbnail archive.');
    return null;
  }

  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'trackyt/thumbnails',
      public_id: videoId || undefined,
      overwrite: true,
      resource_type: 'image'
    });
    
    logger.info(`Archived thumbnail to Cloudinary: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    logger.error(`Cloudinary upload failed for ${imageUrl}:`, error.message);
    // Return null so the app gracefully falls back to the original YouTube URL
    return null;
  }
};

module.exports = { uploadThumbnail, isConfigured };
