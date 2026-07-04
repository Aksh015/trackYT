const cloudinary = require('cloudinary').v2;

// Cloudinary automatically picks up the CLOUDINARY_URL environment variable.
// No explicit config is needed here if it's set in process.env.
// However, we can export it from here to ensure consistent usage across the app.

module.exports = cloudinary;
