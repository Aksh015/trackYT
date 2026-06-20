const mongoose = require('mongoose');

const snapshotSchema = new mongoose.Schema(
  {
    channelId: {
      type: String,
      required: true,
      index: true,
    },
    channelName: {
      type: String,
      required: true,
    },
    profilePicURL: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    // Store IDs of the most recent videos (ordered newest first)
    recentVideoIds: {
      type: [String],
      default: [],
    },
    // Detailed info for the latest video at time of snapshot
    latestVideo: {
      videoId: { type: String, default: '' },
      title: { type: String, default: '' },
      thumbnailURL: { type: String, default: '' },
      publishedAt: { type: Date, default: null },
    },
    // Map of videoId -> { title, thumbnailURL, views, likes, comments } for tracking changes
    videoDetails: {
      type: Map,
      of: {
        title: String,
        thumbnailURL: String,
        views: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        comments: { type: Number, default: 0 },
        publishedAt: { type: Date, default: null },
      },
      default: {},
    },
    takenAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient "latest snapshot for channel" queries
snapshotSchema.index({ channelId: 1, takenAt: -1 });

module.exports = mongoose.model('Snapshot', snapshotSchema);
