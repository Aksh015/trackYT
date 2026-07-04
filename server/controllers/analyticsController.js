const Event = require('../models/Event');
const Channel = require('../models/Channel');
const aiService = require('../services/aiService');

/**
 * GET /api/analytics/:channelId
 * Get analytics stats for a channel.
 */
const getAnalytics = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get channel info
    const channel = await Channel.findOne({
      channelId,
      userId: req.user._id,
    }).lean();

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found.',
      });
    }

    // Aggregate event counts by type
    const eventCounts = await Event.aggregate([
      {
        $match: {
          channelId,
          userId: req.user._id,
          detectedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
        },
      },
    ]);

    // Aggregate uploads per month
    const uploadsPerMonth = await Event.aggregate([
      {
        $match: {
          channelId,
          eventType: 'NEW_VIDEO',
          detectedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$detectedAt' },
            month: { $month: '$detectedAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Aggregate events per day (for timeline charts)
    const eventsPerDay = await Event.aggregate([
      {
        $match: {
          channelId,
          detectedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$detectedAt' } },
            type: '$eventType',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    // Calculate upload frequency
    const newVideoEvents = await Event.find({
      channelId,
      eventType: 'NEW_VIDEO',
    })
      .sort({ detectedAt: 1 })
      .select('detectedAt')
      .lean();

    let avgUploadGapDays = 0;
    if (newVideoEvents.length > 1) {
      let totalGap = 0;
      for (let i = 1; i < newVideoEvents.length; i++) {
        totalGap += new Date(newVideoEvents[i].detectedAt) - new Date(newVideoEvents[i - 1].detectedAt);
      }
      avgUploadGapDays = Math.round(totalGap / (newVideoEvents.length - 1) / (1000 * 60 * 60 * 24) * 10) / 10;
    }

    const stats = {};
    for (const ec of eventCounts) {
      stats[ec._id] = ec.count;
    }

    res.json({
      success: true,
      data: {
        channel,
        period: { start: startDate, end: new Date(), days: parseInt(days) },
        stats,
        avgUploadGapDays,
        uploadsPerMonth: uploadsPerMonth.map((u) => ({
          month: `${u._id.year}-${String(u._id.month).padStart(2, '0')}`,
          count: u.count,
        })),
        eventsPerDay: eventsPerDay.map((e) => ({
          date: e._id.date,
          type: e._id.type,
          count: e.count,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analytics/:channelId/summary
 * Get or generate an AI summary for a channel.
 */
const getAISummary = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const { refresh } = req.query;

    const channel = await Channel.findOne({
      channelId,
      userId: req.user._id,
    }).lean();

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found.',
      });
    }

    // Check for cached report (less than 24h old)
    if (refresh !== 'true') {
      const cached = await aiService.getLatestReport(channelId);
      if (cached) {
        const ageHours = (Date.now() - new Date(cached.generatedAt)) / (1000 * 60 * 60);
        if (ageHours < 24) {
          return res.json({
            success: true,
            data: { report: cached, cached: true },
          });
        }
      }
    }

    // Enforce FREE plan AI Report generation limit
    const isPro = req.user.planType?.toUpperCase() === 'PREMIUM';
    if (!isPro && refresh === 'true') {
      const AIReport = require('../models/AIReport');
      const lastReport = await AIReport.findOne({ userId: req.user._id }).sort({ generatedAt: -1 });
      if (lastReport) {
        const daysSinceLastReport = (Date.now() - new Date(lastReport.generatedAt)) / (1000 * 60 * 60 * 24);
        if (daysSinceLastReport < 30) {
          return res.status(403).json({
            success: false,
            message: 'Free users can only generate 1 new AI report per month. Please upgrade to Premium.',
          });
        }
      }
    }

    // Generate fresh summary
    const report = await aiService.generateSummary(channelId, req.user._id, channel.channelName);

    res.json({
      success: true,
      data: { report, cached: false },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnalytics, getAISummary };
