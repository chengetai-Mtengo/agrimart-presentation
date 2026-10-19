const { createClient } = require('@supabase/supabase-js');
const { config } = require('./config');
const logger = require('./logger');

let supabase = null;
if (config.supabaseUrl && config.supabaseServiceRoleKey) {
  supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey);
  logger.info('Supabase storage client initialized');
} else {
  logger.warn('Supabase credentials missing: uploads will be saved to local disk (ephemeral)');
}

module.exports = supabase;