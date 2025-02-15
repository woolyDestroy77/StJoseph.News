-- Add foreign key for posts author_id to user_profiles
ALTER TABLE posts
DROP CONSTRAINT posts_author_id_fkey,
ADD CONSTRAINT posts_author_id_fkey 
  FOREIGN KEY (author_id) 
  REFERENCES user_profiles(id) 
  ON DELETE CASCADE;

-- Add foreign key for comments author_id to user_profiles
ALTER TABLE comments
DROP CONSTRAINT comments_author_id_fkey,
ADD CONSTRAINT comments_author_id_fkey 
  FOREIGN KEY (author_id) 
  REFERENCES user_profiles(id) 
  ON DELETE CASCADE;

-- Add foreign key for reactions user_id to user_profiles
ALTER TABLE reactions
DROP CONSTRAINT reactions_user_id_fkey,
ADD CONSTRAINT reactions_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES user_profiles(id) 
  ON DELETE CASCADE;

-- Create function to get user profile
CREATE OR REPLACE FUNCTION get_user_profile(user_id uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT jsonb_build_object(
    'id', id,
    'email', email,
    'name', name
  )
  FROM user_profiles
  WHERE id = user_id;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_profile TO authenticated;