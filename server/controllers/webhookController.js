const logger = require('../utils/logger');
const { parseString } = require('xml2js');
const { promisify } = require('util');
const { monitorSingleChannel } = require('../jobs/channelMonitor');
const Channel = require('../models/Channel');

const parseXML = promisify(parseString);

// Simple in-memory lock to prevent concurrent processing of duplicate webhooks
const activeMonitors = new Set();

/**
 * GET /api/webhooks/youtube
 * Handles the WebSub intent verification challenge.
 */
const verifyIntent = (req, res) => {
  const mode = req.query['hub.mode'];
  const topic = req.query['hub.topic'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' || mode === 'unsubscribe') {
    logger.info(`WebSub verification for topic ${topic}`);
    return res.status(200).send(challenge);
  } else {
    return res.status(404).send('Not Found');
  }
};

/**
 * POST /api/webhooks/youtube
 * Handles incoming push notifications from WebSub.
 */
const handleNotification = async (req, res) => {
  // WebSub sends Atom XML payloads, we must respond quickly with 2xx to acknowledge receipt.
  res.status(200).send('OK');

  try {
    const rawBody = req.body;
    if (!rawBody) return;

    let xmlData = rawBody;
    
    // Parse the XML
    const result = await parseXML(xmlData);
    
    if (!result || !result.feed || !result.feed.entry || !result.feed.entry[0]) {
      logger.debug('Received empty or invalid WebSub payload.');
      return;
    }

    const entry = result.feed.entry[0];
    const channelId = entry['yt:channelId']?.[0];
    
    if (!channelId) {
       return;
    }

    logger.info(`⚡ WebSub notification received for channel ${channelId}`);

    // Lookup channel in DB
    const channel = await Channel.findOne({ channelId }).lean();
    if (channel) {
      if (activeMonitors.has(channelId)) {
        logger.debug(`Ignoring duplicate WebSub webhook for ${channelId} (already processing)`);
        return;
      }
      
      activeMonitors.add(channelId);
      try {
        // Trigger the snapshot process instantly
        await monitorSingleChannel(channel);
      } finally {
        activeMonitors.delete(channelId);
      }
    }
  } catch (error) {
    logger.error('Error handling WebSub notification:', error.message);
  }
};

module.exports = { verifyIntent, handleNotification };
