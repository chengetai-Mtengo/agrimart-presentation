const path = require('path');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '..', '..', '.env');
const dotenvResult = dotenv.config({ path: envPath });

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function validateDatabaseUrl(value) {
  const databaseUrl = new URL(value);
  if (!['postgres:', 'postgresql:'].includes(databaseUrl.protocol)) {
    throw new Error('DATABASE_URL must use postgres:// or postgresql://');
  }
  return value;
}

if (dotenvResult.error && process.env.NODE_ENV !== 'test') {
  throw new Error(`Unable to load .env from ${envPath}`);
}

const NODE_ENV = process.env.NODE_ENV || 'development';
const DATABASE_URL = validateDatabaseUrl(requireEnv('DATABASE_URL'));
const JWT_SECRET = requireEnv('JWT_SECRET');

module.exports = {
  NODE_ENV,
  PORT: process.env.PORT || '5000',
  DATABASE_URL,
  JWT_SECRET,
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || '*',
  API_URL: process.env.API_URL || 'http://localhost:5000',
  LOG_LEVEL: process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug'),
};
