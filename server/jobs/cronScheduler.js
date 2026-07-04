const cron = require('node-cron');
const { CRON_SCHEDULE_HOURLY, CRON_SCHEDULE_DAILY } = require('../utils/constants');
const { monitorAllChannels } = require('./channelMonitor');
const logger = require('../utils/logger');

let hourlyJob = null;
let dailyJob = null;

/**
 * Start the cron scheduler.
 * Runs the channel monitoring job every hour.
 *
 * NOTE: On Render free tier, the server may sleep after 15min of inactivity.
 * If this becomes a problem, consider:
 * 1. UptimeRobot pinger (free) to keep alive
 * 2. GitHub Actions scheduled workflow
 * 3. External cron service (cron-job.org)
 */
const startCronJobs = () => {
  if (hourlyJob || dailyJob) {
    logger.warn('Cron jobs already running. Skipping duplicate start.');
    return;
  }

  // Validate cron expressions
  if (!cron.validate(CRON_SCHEDULE_HOURLY) || !cron.validate(CRON_SCHEDULE_DAILY)) {
    logger.error('Invalid cron expressions');
    return;
  }

  hourlyJob = cron.schedule(CRON_SCHEDULE_HOURLY, async () => {
    logger.info(`⏰ Hourly cron triggered at ${new Date().toISOString()}`);
    await monitorAllChannels(['PREMIUM']);
  });

  dailyJob = cron.schedule(CRON_SCHEDULE_DAILY, async () => {
    logger.info(`⏰ Daily cron triggered at ${new Date().toISOString()}`);
    await monitorAllChannels(['FREE']);
  });

  logger.info(`📅 Cron scheduler started: Hourly for Premium, Daily for Free`);
};

/**
 * Stop the cron scheduler gracefully.
 */
const stopCronJobs = () => {
  if (hourlyJob) {
    hourlyJob.stop();
    hourlyJob = null;
  }
  if (dailyJob) {
    dailyJob.stop();
    dailyJob = null;
  }
  logger.info('Cron scheduler stopped.');
};

module.exports = { startCronJobs, stopCronJobs };
