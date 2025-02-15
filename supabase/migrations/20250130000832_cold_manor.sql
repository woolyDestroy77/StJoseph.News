-- Drop and recreate settings policies with correct permissions
DROP POLICY IF EXISTS "Settings are viewable by everyone" ON settings;
DROP POLICY IF EXISTS "Only admins can modify settings" ON settings;

-- Create new policies
CREATE POLICY "Settings are viewable by everyone" 
  ON settings FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can modify settings" 
  ON settings 
  USING (true)
  WITH CHECK (true);

-- Insert default settings if they don't exist
INSERT INTO settings (
  title, 
  description, 
  posts_per_page, 
  theme, 
  social_links
) VALUES (
  'St.Josef News',
  'Latest news and updates from St.Josef International School',
  9,
  'dark',
  '{"twitter": "", "github": "", "linkedin": ""}'
) ON CONFLICT DO NOTHING;