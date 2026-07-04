require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');
const { startCronJobs } = require('./jobs/cronScheduler');
const logger = require('./utils/logger');

// Route imports
const authRoutes = require('./routes/authRoutes');
const channelRoutes = require('./routes/channelRoutes');
const eventRoutes = require('./routes/eventRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const billingRoutes = require('./routes/billingRoutes');
const { handleWebhook } = require('./controllers/billingController');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy (needed for proper rate limiting behind Render/Vercel)
app.set('trust proxy', 1);

// ─── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Stripe webhook must use raw body parsing
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), handleWebhook);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting on all API routes
app.use('/api', apiLimiter);

// ─── Routes ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/billing', billingRoutes);

// Health check endpoint (useful for UptimeRobot / Render)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── Error Handler (must be last) ───────────────────────────
app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`🚀 TrackYT server running on port ${PORT}`);
      logger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Start cron jobs
    startCronJobs();
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
