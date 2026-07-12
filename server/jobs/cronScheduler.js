const cron = require('node-cron');
const { CRON_SCHEDULE_HOURLY, CRON_SCHEDULE_DAILY, CRON_SCHEDULE_15MIN, CRON_SCHEDULE_WEBSUB_RENEW } = require('../utils/constants');
const { monitorAllChannels } = require('./channelMonitor');
const youtubeService = require('../services/youtubeService');
const logger = require('../utils/logger');

let fifteenMinJob = null;
let hourlyJob = null;
let renewJob = null;

/**
 * Start the cron scheduler.
 * Runs the channel monitoring job every 15 minutes for Premium and hourly for Free.
 * Also runs a daily WebSub renewal job.
 *
 * NOTE: On Render free tier, the server may sleep after 15min of inactivity.
 * If this becomes a problem, consider:
 * 1. UptimeRobot pinger (free) to keep alive
 * 2. GitHub Actions scheduled workflow
 * 3. External cron service (cron-job.org)
 */
const startCronJobs = () => {
  if (fifteenMinJob || hourlyJob || renewJob) {
    logger.warn('Cron jobs already running. Skipping duplicate start.');
    return;
  }

  // Validate cron expressions
  if (!cron.validate(CRON_SCHEDULE_15MIN) || !cron.validate(CRON_SCHEDULE_HOURLY) || !cron.validate(CRON_SCHEDULE_WEBSUB_RENEW)) {
    logger.error('Invalid cron expressions');
    return;
  }

  fifteenMinJob = cron.schedule(CRON_SCHEDULE_15MIN, async () => {
    logger.info(`⏰ 15-Min cron triggered at ${new Date().toISOString()}`);
    await monitorAllChannels(['PREMIUM']);
  });

  hourlyJob = cron.schedule(CRON_SCHEDULE_HOURLY, async () => {
    logger.info(`⏰ Hourly cron triggered at ${new Date().toISOString()}`);
    await monitorAllChannels(['FREE']);
  });
  
  renewJob = cron.schedule(CRON_SCHEDULE_WEBSUB_RENEW, async () => {
    logger.info(`⏰ Daily WebSub Renew cron triggered at ${new Date().toISOString()}`);
    try {
      await youtubeService.renewAllWebSubSubscriptions();
    } catch (err) {
      logger.error('Failed to renew WebSub subscriptions:', err.message);
    }
  });

  logger.info(`📅 Cron scheduler started: 15-Min for Premium, Hourly for Free, Daily for WebSub Renewal`);
};

/**
 * Stop the cron scheduler gracefully.
 */
const stopCronJobs = () => {
  if (fifteenMinJob) {
    fifteenMinJob.stop();
    fifteenMinJob = null;
  }
  if (hourlyJob) {
    hourlyJob.stop();
    hourlyJob = null;
  }
  if (renewJob) {
    renewJob.stop();
    renewJob = null;
  }
  logger.info('Cron scheduler stopped.');
};

module.exports = { startCronJobs, stopCronJobs };
