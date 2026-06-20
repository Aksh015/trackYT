const mongoose = require('mongoose');
const { EVENT_TYPES } = require('../utils/constants');

const eventSchema = new mongoose.Schema(
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
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: Object.values(EVENT_TYPES),
      index: true,
    },
    // What changed — structure varies by event type
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // Additional metadata (videoId, title, etc.)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    detectedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Optimized for timeline queries: "all events for a channel, sorted by date"
eventSchema.index({ channelId: 1, detectedAt: -1 });

// Optimized for dashboard feed: "all events for a user, sorted by date"
eventSchema.index({ userId: 1, detectedAt: -1 });

// Optimized for filtering: "all events of a type for a user"
eventSchema.index({ userId: 1, eventType: 1, detectedAt: -1 });

module.exports = mongoose.model('Event', eventSchema);
