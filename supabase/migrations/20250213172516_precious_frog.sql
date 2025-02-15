-- Clean up existing settings
DELETE FROM settings
WHERE id NOT IN (
  SELECT id
  FROM settings
  ORDER BY created_at ASC
  LIMIT 1
);

-- Add unique constraint to ensure only one settings record
ALTER TABLE settings
ADD CONSTRAINT single_settings_record
CHECK (id = (SELECT MIN(id) FROM settings));

-- Update settings policies
DROP POLICY IF EXISTS "Settings are viewable by everyone" ON settings;
DROP POLICY IF EXISTS "Authenticated users can modify settings" ON settings;

CREATE POLICY "Settings are viewable by everyone"
ON settings FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can modify settings"
ON settings FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);