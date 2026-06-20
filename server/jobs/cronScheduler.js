const cron = require('node-cron');
const { CRON_SCHEDULE } = require('../utils/constants');
const { monitorAllChannels } = require('./channelMonitor');
const logger = require('../utils/logger');

let scheduledJob = null;

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
  if (scheduledJob) {
    logger.warn('Cron jobs already running. Skipping duplicate start.');
    return;
  }

  // Validate cron expression
  if (!cron.validate(CRON_SCHEDULE)) {
    logger.error(`Invalid cron expression: ${CRON_SCHEDULE}`);
    return;
  }

  scheduledJob = cron.schedule(CRON_SCHEDULE, async () => {
    logger.info(`⏰ Cron triggered at ${new Date().toISOString()}`);
    await monitorAllChannels();
  });

  logger.info(`📅 Cron scheduler started: "${CRON_SCHEDULE}" (every hour)`);
};

/**
 * Stop the cron scheduler gracefully.
 */
const stopCronJobs = () => {
  if (scheduledJob) {
    scheduledJob.stop();
    scheduledJob = null;
    logger.info('Cron scheduler stopped.');
  }
};

module.exports = { startCronJobs, stopCronJobs };
