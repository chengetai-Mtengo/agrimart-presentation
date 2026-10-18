const { isDatabaseReady } = require('../config/database');

function databaseRequired(req, res, next) {
  // Skip database check in test environment to allow validation tests
  if (process.env.NODE_ENV === 'test' || isDatabaseReady()) {
    return next();
  }
  return res.status(503).json({ error: 'Database unavailable' });
}

module.exports = { databaseRequired };
