-- src/utils/supabase/migrations/20240705140100_create_recommendations_function.sql

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_artist_recommendations(uuid);

-- Create the function
CREATE OR REPLACE FUNCTION get_artist_recommendations(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  name TEXT,
  genre TEXT,
  image_url TEXT
) AS $$
DECLARE
  followed_genres TEXT[];
  followed_artist_ids uuid[];
BEGIN
  -- 1. Get genres of artists followed by the user
  SELECT array_agg(DISTINCT a.genre)
  INTO followed_genres
  FROM followed_artists fa
  JOIN artists a ON fa.artist_id = a.id
  WHERE fa.user_id = p_user_id AND a.genre IS NOT NULL;

  -- If the user follows no artists with genres, return empty
  IF followed_genres IS NULL OR array_length(followed_genres, 1) IS NULL THEN
    RETURN QUERY SELECT a.id, a.name, a.genre, a.image_url FROM artists a WHERE FALSE;
    RETURN;
  END IF;

  -- 2. Get IDs of artists already followed by the user
  SELECT array_agg(fa.artist_id)
  INTO followed_artist_ids
  FROM followed_artists fa
  WHERE fa.user_id = p_user_id;

  -- 3. Find artists with the same genres, excluding already followed artists
  RETURN QUERY
    SELECT a.id, a.name, a.genre, a.image_url
    FROM artists a
    WHERE a.genre = ANY(followed_genres)
      AND NOT (a.id = ANY(followed_artist_ids))
    LIMIT 10;
END;
$$ LANGUAGE plpgsql; 