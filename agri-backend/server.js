const app = require('./src/app');
const { config } = require('./src/config/config');
const { initializeDatabase, closeDatabase } = require('./src/config/database');
const logger = require('./src/config/logger');

let server;

async function startServer() {
  try {
    await initializeDatabase();
    logger.info('Database connected successfully');
  } catch (error) {
    if (config.isDevelopment) {
      logger.warn('Database connection failed, starting in degraded mode', { message: error.message });
    } else {
      logger.error('Backend startup aborted. Fix the database configuration/connection and restart.', {
        message: error.message,
        stack: error.stack,
      });
      process.exit(1);
    }
  }

  server = app.listen(config.port, () => {
    logger.info(`AgriMart Backend running on http://localhost:${config.port}`);
    logger.info(`API Docs available at http://localhost:${config.port}/api-docs`);
  }).on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${config.port} is already in use. Stop the other process or change PORT in .env.`);
      process.exit(1);
    }
    logger.error('HTTP server error', { message: error.message, stack: error.stack });
    process.exit(1);
  });
}

async function shutdown(signal) {
  logger.info(`${signal} received. Shutting down gracefully.`);
  if (server) {
    server.close(async () => {
      await closeDatabase();
      process.exit(0);
    });
    return;
  }
  await closeDatabase();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();
