const Snapshot = require('../models/Snapshot');
const Event = require('../models/Event');

/**
 * @desc    Get detailed history and stats for a specific video
 * @route   GET /api/channels/:channelId/videos/:videoId/history
 * @access  Private
 */
const getVideoHistory = async (req, res, next) => {
  try {
    const { channelId, videoId } = req.params;

    // 1. Fetch all snapshots for this channel in chronological order
    const snapshots = await Snapshot.find({ channelId })
      .select('takenAt videoDetails')
      .sort({ takenAt: 1 })
      .lean();

    // 2. Extract time-series data for this specific video
    const timeSeriesData = [];
    let latestDetails = null;

    snapshots.forEach((snapshot) => {
      const details = snapshot.videoDetails?.[videoId];
      if (details) {
        timeSeriesData.push({
          timestamp: snapshot.takenAt,
          views: details.views || 0,
          likes: details.likes || 0,
          comments: details.comments || 0,
        });
        latestDetails = details;
      }
    });

    if (!latestDetails) {
      return res.status(404).json({ message: 'Video not found in tracked history' });
    }

    // 3. Fetch all events associated with this video
    const events = await Event.find({ channelId, 'metadata.videoId': videoId })
      .sort({ createdAt: -1 })
      .lean();

    // 4. Calculate some aggregate metrics
    const totalTitleEdits = events.filter((e) => e.eventType === 'TITLE_CHANGED').length;
    const totalThumbSwaps = events.filter((e) => e.eventType === 'THUMBNAIL_CHANGED').length;

    res.json({
      videoId,
      channelId,
      currentDetails: latestDetails,
      stats: timeSeriesData,
      events,
      metrics: {
        totalTitleEdits,
        totalThumbSwaps,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVideoHistory,
};
