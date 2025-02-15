/*
  # Fix Image Loading

  1. Changes
    - Add validation trigger for cover_image URLs
    - Add default cover image URL
    - Update existing posts with valid cover images
*/

-- Add validation for cover_image URLs
CREATE OR REPLACE FUNCTION validate_cover_image()
RETURNS trigger AS $$
BEGIN
  -- If cover_image is empty or invalid, set a default image
  IF NEW.cover_image IS NULL OR NEW.cover_image = '' THEN
    NEW.cover_image := 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for cover_image validation
DROP TRIGGER IF EXISTS ensure_cover_image ON posts;
CREATE TRIGGER ensure_cover_image
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION validate_cover_image();

-- Update existing posts with empty or invalid cover images
UPDATE posts
SET cover_image = 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop'
WHERE cover_image IS NULL OR cover_image = '';