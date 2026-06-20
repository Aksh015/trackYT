const Channel = require('../models/Channel');
const snapshotService = require('../services/snapshotService');
const eventService = require('../services/eventService');
const logger = require('../utils/logger');

/**
 * Monitor all tracked channels.
 * For each channel: take snapshot → diff with previous → create events.
 * Channels are processed sequentially to avoid API rate limits.
 */
const monitorAllChannels = async () => {
  logger.info('🔄 Starting channel monitoring job...');

  try {
    // Get all unique channels being tracked
    const channels = await Channel.find({}).lean();

    if (channels.length === 0) {
      logger.info('No channels to monitor.');
      return;
    }

    logger.info(`Monitoring ${channels.length} channel(s)...`);

    let successCount = 0;
    let errorCount = 0;

    for (const channel of channels) {
      try {
        await monitorSingleChannel(channel);
        successCount++;

        // Update lastCheckedAt
        await Channel.findByIdAndUpdate(channel._id, {
          lastCheckedAt: new Date(),
        });

        // Small delay between channels to spread API usage
        await delay(2000);
      } catch (error) {
        errorCount++;
        logger.error(`Failed to monitor ${channel.channelName}:`, error.message);
      }
    }

    logger.info(`✅ Monitoring complete: ${successCount} success, ${errorCount} errors`);
  } catch (error) {
    logger.error('Channel monitoring job failed:', error.message);
  }
};

/**
 * Monitor a single channel: snapshot → diff → events.
 */
const monitorSingleChannel = async (channel) => {
  // Get previous snapshot
  const previousSnapshot = await snapshotService.getLatestSnapshot(channel.channelId);

  // Take new snapshot
  const currentSnapshot = await snapshotService.takeSnapshot(channel);

  // Diff and detect changes
  const changes = snapshotService.diffSnapshots(previousSnapshot, currentSnapshot);

  if (changes.length === 0) {
    logger.debug(`No changes for ${channel.channelName}`);
    return;
  }

  logger.info(`Detected ${changes.length} change(s) for ${channel.channelName}`);

  // Also update channel doc if name or profile pic changed
  const nameChange = changes.find((c) => c.eventType === 'CHANNEL_RENAMED');
  const pfpChange = changes.find((c) => c.eventType === 'PROFILE_PICTURE_CHANGED');

  if (nameChange || pfpChange || (currentSnapshot.description !== channel.description)) {
    const updates = {};
    if (nameChange) updates.channelName = nameChange.newValue.channelName;
    if (pfpChange) updates.profilePicURL = pfpChange.newValue.profilePicURL;
    if (currentSnapshot.description !== channel.description) updates.description = currentSnapshot.description;
    await Channel.findByIdAndUpdate(channel._id, updates);
  }

  // Create events for all users tracking this channel
  const trackingUsers = await Channel.find({ channelId: channel.channelId })
    .select('userId')
    .lean();

  for (const change of changes) {
    for (const tracker of trackingUsers) {
      await eventService.createEvent({
        channelId: channel.channelId,
        userId: tracker.userId,
        eventType: change.eventType,
        oldValue: change.oldValue,
        newValue: change.newValue,
        metadata: change.metadata,
      });
    }
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = { monitorAllChannels, monitorSingleChannel };
