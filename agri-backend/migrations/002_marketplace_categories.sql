-- Seed the expanded marketplace catalogue used by the web and mobile apps.
-- Safe to run repeatedly against PostgreSQL/Supabase.
INSERT INTO categories (id, name, icon, description, color) VALUES
  ('dairy', 'Dairy', '🥛', 'Milk, cheese, yoghurt, butter', '#0EA5E9'),
  ('livestock', 'Livestock', '🐄', 'Cattle, goats, sheep, pigs', '#7C3AED'),
  ('poultry', 'Poultry', '🐔', 'Chickens, ducks, eggs, chicks', '#DC2626'),
  ('fish', 'Fish', '🐟', 'Fresh fish, dried fish, fingerlings', '#0284C7'),
  ('farm-inputs', 'Farm Inputs', '🚜', 'Seed, fertiliser, feed, tools', '#475569')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  color = EXCLUDED.color;
