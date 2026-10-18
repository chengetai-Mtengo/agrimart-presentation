const envVars = require('./env');

function parseOrigins(value) {
  if (!value || value === '*') {
    return '*';
  }
  return value.split(',').map((origin) => origin.trim()).filter(Boolean);
}

const env = envVars.NODE_ENV || 'development';

const configs = {
  development: {
    port: Number(envVars.PORT) || 5000,
    logLevel: envVars.LOG_LEVEL || 'debug',
    apiUrl: envVars.API_URL || 'http://localhost:5000',
    allowedOrigins: parseOrigins(envVars.ALLOWED_ORIGINS),
    databaseUrl: envVars.DATABASE_URL,
    jwtSecret: envVars.JWT_SECRET,
    supabaseUrl: envVars.SUPABASE_URL,
    supabaseServiceRoleKey: envVars.SUPABASE_SERVICE_ROLE_KEY,
    isProduction: false,
    isDevelopment: true,
    isTest: false,
  },
  staging: {
    port: Number(envVars.PORT) || 5000,
    logLevel: envVars.LOG_LEVEL || 'info',
    apiUrl: envVars.API_URL || 'https://staging-api.agrimart.com',
    allowedOrigins: parseOrigins(envVars.ALLOWED_ORIGINS),
    databaseUrl: envVars.DATABASE_URL,
    jwtSecret: envVars.JWT_SECRET,
    supabaseUrl: envVars.SUPABASE_URL,
    supabaseServiceRoleKey: envVars.SUPABASE_SERVICE_ROLE_KEY,
    isProduction: false,
    isDevelopment: false,
    isTest: false,
  },
  production: {
    port: Number(envVars.PORT) || 5000,
    logLevel: envVars.LOG_LEVEL || 'error',
    apiUrl: envVars.API_URL,
    allowedOrigins: parseOrigins(envVars.ALLOWED_ORIGINS),
    databaseUrl: envVars.DATABASE_URL,
    jwtSecret: envVars.JWT_SECRET,
    supabaseUrl: envVars.SUPABASE_URL,
    supabaseServiceRoleKey: envVars.SUPABASE_SERVICE_ROLE_KEY,
    isProduction: true,
    isDevelopment: false,
    isTest: false,
  },
};

const config = configs[env] || configs.development;

module.exports = { config, env };
