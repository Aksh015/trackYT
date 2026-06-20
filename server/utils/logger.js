const LOG_LEVELS = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 };

const currentLevel = process.env.NODE_ENV === 'production'
  ? LOG_LEVELS.INFO
  : LOG_LEVELS.DEBUG;

const timestamp = () => new Date().toISOString();

const logger = {
  error: (...args) => {
    if (currentLevel >= LOG_LEVELS.ERROR) {
      console.error(`[${timestamp()}] ❌ ERROR:`, ...args);
    }
  },
  warn: (...args) => {
    if (currentLevel >= LOG_LEVELS.WARN) {
      console.warn(`[${timestamp()}] ⚠️  WARN:`, ...args);
    }
  },
  info: (...args) => {
    if (currentLevel >= LOG_LEVELS.INFO) {
      console.log(`[${timestamp()}] ℹ️  INFO:`, ...args);
    }
  },
  debug: (...args) => {
    if (currentLevel >= LOG_LEVELS.DEBUG) {
      console.log(`[${timestamp()}] 🔍 DEBUG:`, ...args);
    }
  },
};

module.exports = logger;
