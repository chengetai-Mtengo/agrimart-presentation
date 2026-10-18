const { Pool } = require('pg');
const { config } = require('./config');
const logger = require('./logger');

let dbReady = false;

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseUrl.includes('localhost') || config.databaseUrl.includes('127.0.0.1')
    ? false
    : { rejectUnauthorized: false },
});

async function initializeDatabase() {
  logger.info('Connecting to Supabase PostgreSQL...');
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    dbReady = true;
    logger.info('Connected to Supabase PostgreSQL');
  } catch (error) {
    dbReady = false;
    logger.error('Supabase connection error', { message: error.message, stack: error.stack });
    throw error;
  } finally {
    client.release();
  }
}

function isDatabaseReady() {
  return dbReady;
}

async function closeDatabase() {
  dbReady = false;
  await pool.end();
}

module.exports = {
  pool,
  initializeDatabase,
  isDatabaseReady,
  closeDatabase,
};
