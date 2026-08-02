ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to app_settings" ON app_settings;
CREATE POLICY "Allow public read access to app_settings" ON app_settings FOR SELECT USING (true);
