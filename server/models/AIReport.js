const mongoose = require('mongoose');

const aiReportSchema = new mongoose.Schema(
  {
    channelId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    stats: {
      totalVideos: { type: Number, default: 0 },
      titleChanges: { type: Number, default: 0 },
      thumbnailChanges: { type: Number, default: 0 },
      channelRenames: { type: Number, default: 0 },
      profilePicChanges: { type: Number, default: 0 },
      avgUploadGapDays: { type: Number, default: 0 },
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

aiReportSchema.index({ channelId: 1, generatedAt: -1 });

module.exports = mongoose.model('AIReport', aiReportSchema);
