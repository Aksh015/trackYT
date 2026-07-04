const { Cashfree, CFEnvironment } = require('cashfree-pg');
const User = require('../models/User');
const logger = require('../utils/logger');
const crypto = require('crypto');

let cashfree = null;
// Initialize Cashfree
if (process.env.CASHFREE_APP_ID) {
  cashfree = new Cashfree(
    CFEnvironment.SANDBOX,
    process.env.CASHFREE_APP_ID,
    process.env.CASHFREE_SECRET_KEY
  );
}

/**
 * POST /api/billing/create-checkout-session
 * Generate a Cashfree Order for the user.
 */
const createCheckoutSession = async (req, res, next) => {
  try {
    const { _id, email } = req.user;

    // If Cashfree isn't configured, fallback to our mock checkout page!
    if (!cashfree) {
      return res.json({
        success: true,
        data: { url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/mock-checkout` },
      });
    }

    const orderId = `order_${_id}_${Date.now()}`;

    const request = {
      order_amount: 799.00,
      order_currency: "INR",
      customer_details: {
        customer_id: _id.toString(),
        customer_email: email,
        customer_phone: "9999999999" // Dummy required phone
      },
      order_meta: {
        return_url: `${process.env.CLIENT_URL}/billing?success=true`
      }
    };

    const response = await cashfree.PGCreateOrder(request);

    res.json({
      success: true,
      data: { payment_session_id: response.data.payment_session_id },
    });
  } catch (error) {
    logger.error('Error creating Cashfree order:', error?.response?.data || error);
    next(error);
  }
};

/**
 * POST /api/billing/mock-success
 * A fake webhook to upgrade user without Cashfree.
 */
const mockSuccess = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { planType: 'PREMIUM' });
    res.json({ success: true, message: 'Upgraded to premium successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/billing/webhook
 * Handle Cashfree webhook events.
 */
const handleWebhook = async (req, res) => {
  try {
    const rawBody = req.body; // Needs to be raw string/buffer for Cashfree
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];

    cashfree.PGVerifyWebhookSignature(signature, rawBody.toString(), timestamp);

    const payload = JSON.parse(rawBody.toString());

    if (payload.type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const customerId = payload.data.customer_details.customer_id;
      if (customerId) {
        await User.findByIdAndUpdate(customerId, { planType: 'PREMIUM' });
        logger.info(`User ${customerId} upgraded to PREMIUM successfully via Cashfree.`);
      }
    }

    res.status(200).send('Webhook Received');
  } catch (err) {
    logger.error(`Cashfree Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

/**
 * POST /api/billing/mock-downgrade
 * A fake webhook to downgrade user for testing.
 */
const mockDowngrade = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { planType: 'FREE' });
    res.json({ success: true, message: 'Downgraded to free successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createCheckoutSession, handleWebhook, mockSuccess, mockDowngrade };
