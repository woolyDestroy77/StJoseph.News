/*
  # Fix database relationships and add functions

  1. Changes
    - Add functions to get user metadata
    - Add functions to get post details with author info
    - Add functions to get comment details with author info
  
  2. Security
    - Functions are accessible to authenticated users
    - Maintains existing RLS policies
*/

-- Create helper functions to get user metadata
CREATE OR REPLACE FUNCTION get_user_name(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(raw_user_meta_data->>'name', 'Unknown User')
  FROM auth.users
  WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION get_user_email(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(email, 'unknown@example.com')
  FROM auth.users
  WHERE id = user_id;
$$;

-- Create function to get post with author details
CREATE OR REPLACE FUNCTION get_post_with_author(post_row posts)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT json_build_object(
    'id', post_row.id,
    'title', post_row.title,
    'content', post_row.content,
    'cover_image', post_row.cover_image,
    'published_at', post_row.published_at,
    'reading_time', post_row.reading_time,
    'educational_level', post_row.educational_level,
    'author', json_build_object(
      'id', post_row.author_id,
      'name', get_user_name(post_row.author_id),
      'email', get_user_email(post_row.author_id)
    )
  );
$$;

-- Create function to get comment with author details
CREATE OR REPLACE FUNCTION get_comment_with_author(comment_row comments)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT json_build_object(
    'id', comment_row.id,
    'content', comment_row.content,
    'created_at', comment_row.created_at,
    'author', json_build_object(
      'id', comment_row.author_id,
      'name', get_user_name(comment_row.author_id),
      'email', get_user_email(comment_row.author_id)
    )
  );
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_name TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_email TO authenticated;
GRANT EXECUTE ON FUNCTION get_post_with_author TO authenticated;
GRANT EXECUTE ON FUNCTION get_comment_with_author TO authenticated;