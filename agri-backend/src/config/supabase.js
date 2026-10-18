const { createClient } = require('@supabase/supabase-js');
const { config } = require('./config');

let supabase = null;
if (config.supabaseUrl && config.supabaseServiceRoleKey) {
  supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey);
}

module.exports = supabase;