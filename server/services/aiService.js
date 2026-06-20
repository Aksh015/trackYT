const axios = require('axios');
const logger = require('../utils/logger');
const { GEMINI_API_BASE } = require('../utils/constants');
const AIReport = require('../models/AIReport');
const Event = require('../models/Event');

/**
 * Generate an AI activity summary for a channel using Google Gemini Flash.
 */
const generateSummary = async (channelId, userId, channelName) => {
  // Get events from the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const events = await Event.find({
    channelId,
    detectedAt: { $gte: thirtyDaysAgo },
  })
    .sort({ detectedAt: -1 })
    .lean();

  // Compute stats
  const stats = {
    totalVideos: events.filter((e) => e.eventType === 'NEW_VIDEO').length,
    titleChanges: events.filter((e) => e.eventType === 'TITLE_CHANGED').length,
    thumbnailChanges: events.filter((e) => e.eventType === 'THUMBNAIL_CHANGED').length,
    channelRenames: events.filter((e) => e.eventType === 'CHANNEL_RENAMED').length,
    profilePicChanges: events.filter((e) => e.eventType === 'PROFILE_PICTURE_CHANGED').length,
    avgUploadGapDays: 0,
  };

  // Calculate average upload gap
  const newVideoEvents = events
    .filter((e) => e.eventType === 'NEW_VIDEO')
    .sort((a, b) => new Date(a.detectedAt) - new Date(b.detectedAt));

  if (newVideoEvents.length > 1) {
    let totalGap = 0;
    for (let i = 1; i < newVideoEvents.length; i++) {
      const gap = new Date(newVideoEvents[i].detectedAt) - new Date(newVideoEvents[i - 1].detectedAt);
      totalGap += gap;
    }
    stats.avgUploadGapDays = Math.round(totalGap / (newVideoEvents.length - 1) / (1000 * 60 * 60 * 24) * 10) / 10;
  }

  // Build prompt for Gemini
  const prompt = buildPrompt(channelName, stats, events);

  let summary;
  try {
    summary = await callGemini(prompt);
  } catch (error) {
    logger.warn('Gemini API failed, using fallback summary:', error.message);
    summary = buildFallbackSummary(channelName, stats);
  }

  // Store the report
  const report = await AIReport.create({
    channelId,
    userId,
    summary,
    stats,
    periodStart: thirtyDaysAgo,
    periodEnd: new Date(),
    generatedAt: new Date(),
  });

  return report;
};

/**
 * Build a prompt for the Gemini API.
 */
const buildPrompt = (channelName, stats, events) => {
  const recentEvents = events.slice(0, 20).map((e) => {
    const date = new Date(e.detectedAt).toLocaleDateString();
    switch (e.eventType) {
      case 'NEW_VIDEO':
        return `  - ${date}: Uploaded new video "${e.newValue?.title || 'Unknown'}"`;
      case 'TITLE_CHANGED':
        return `  - ${date}: Changed video title from "${e.oldValue?.title}" to "${e.newValue?.title}"`;
      case 'THUMBNAIL_CHANGED':
        return `  - ${date}: Changed a video thumbnail`;
      case 'CHANNEL_RENAMED':
        return `  - ${date}: Renamed channel from "${e.oldValue?.channelName}" to "${e.newValue?.channelName}"`;
      case 'PROFILE_PICTURE_CHANGED':
        return `  - ${date}: Changed profile picture`;
      default:
        return `  - ${date}: ${e.eventType}`;
    }
  });

  return `You are a YouTube analytics assistant. Analyze the following channel activity data and provide a highly detailed, descriptive, and insightful summary (about 4-6 sentences). 
Instead of just repeating the numbers, provide context. For example, if there are new videos, mention their titles and discuss the upload frequency. If there are title or thumbnail changes, explain what this suggests (e.g., A/B testing, optimizing for CTR). Make it sound like an expert analyst's report.

Channel: ${channelName}
Period: Last 30 days

Statistics:
- New videos uploaded: ${stats.totalVideos}
- Title changes: ${stats.titleChanges}
- Thumbnail changes: ${stats.thumbnailChanges}
- Channel renames: ${stats.channelRenames}
- Profile picture changes: ${stats.profilePicChanges}
- Average upload gap: ${stats.avgUploadGapDays} days

Recent Activity Log:
${recentEvents.join('\n') || '  No recent activity detected.'}

Please write the summary paragraph directly without conversational filler.`;
};

/**
 * Call the Google Gemini API.
 */
const callGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const response = await axios.post(
    `${GEMINI_API_BASE}/models/gemini-flash-latest:generateContent?key=${apiKey}`,
    {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      },
    },
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    }
  );

  const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response from Gemini');
  }

  return text.trim();
};

/**
 * Fallback summary when AI is unavailable.
 */
const buildFallbackSummary = (channelName, stats) => {
  const parts = [`In the last 30 days, ${channelName} has been`];

  if (stats.totalVideos === 0) {
    parts.push('relatively quiet with no new uploads detected.');
  } else {
    parts.push(`active with ${stats.totalVideos} new video${stats.totalVideos > 1 ? 's' : ''} uploaded.`);
    if (stats.avgUploadGapDays > 0) {
      parts.push(`The average gap between uploads is ${stats.avgUploadGapDays} days.`);
    }
  }

  if (stats.titleChanges > 0) {
    parts.push(`${stats.titleChanges} video title change${stats.titleChanges > 1 ? 's were' : ' was'} detected, suggesting A/B testing or content optimization.`);
  }

  if (stats.thumbnailChanges > 0) {
    parts.push(`${stats.thumbnailChanges} thumbnail update${stats.thumbnailChanges > 1 ? 's were' : ' was'} detected.`);
  }

  return parts.join(' ');
};

/**
 * Rewrite a raw channel bio into a professional 3rd-person summary.
 */
const rewriteBio = async (channelName, rawBio) => {
  if (!rawBio || rawBio.trim() === '') return '';

  const prompt = `You are a professional tech analyst. Rewrite the following YouTube channel bio into a concise, professional, 3rd-person summary (2-3 sentences max) describing what the channel is about. Remove any self-promotional links or conversational filler.

Channel Name: ${channelName}
Original Bio:
"${rawBio}"

Professional Summary:`;

  try {
    const summary = await callGemini(prompt);
    return summary;
  } catch (error) {
    logger.warn(`Failed to rewrite bio for ${channelName}:`, error.message);
    return rawBio; // Fallback to original
  }
};

/**
 * Get the latest AI report for a channel, or null.
 */
const getLatestReport = async (channelId) => {
  return AIReport.findOne({ channelId }).sort({ generatedAt: -1 }).lean();
};

module.exports = { generateSummary, getLatestReport, rewriteBio };
