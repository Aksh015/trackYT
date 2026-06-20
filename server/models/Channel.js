const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    channelId: {
      type: String,
      required: [true, 'YouTube channel ID is required'],
      index: true,
    },
    channelName: {
      type: String,
      required: true,
    },
    channelHandle: {
      type: String,
      default: '',
    },
    channelURL: {
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
    lastCheckedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: a user can only track a channel once
channelSchema.index({ userId: 1, channelId: 1 }, { unique: true });

module.exports = mongoose.model('Channel', channelSchema);
