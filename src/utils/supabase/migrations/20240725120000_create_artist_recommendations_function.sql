-- Function to get artist recommendations based on venues the user follows
-- This finds artists who have performed at venues the user follows
CREATE OR REPLACE FUNCTION get_venue_based_artist_recommendations(user_id_param UUID, limit_param INTEGER DEFAULT 5)
RETURNS SETOF artists AS $$
BEGIN
  RETURN QUERY
  -- Select artists that have performed at venues the user follows
  WITH artist_counts AS (
    SELECT 
      a.*,
      COUNT(*) AS appearance_count
    FROM artists a
    JOIN events e ON a.id = e.artist_id
    JOIN followed_venues fv ON e.venue_id = fv.venue_id
    WHERE fv.user_id = user_id_param
    -- Exclude artists the user already follows
    AND NOT EXISTS (
      SELECT 1 
      FROM followed_artists fa 
      WHERE fa.user_id = user_id_param AND fa.artist_id = a.id
    )
    GROUP BY a.id
  )
  SELECT 
    id, name, created_at, updated_at
  FROM artist_counts
  ORDER BY appearance_count DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- Add an index to improve performance of the recommendation query
CREATE INDEX IF NOT EXISTS idx_events_artist_venue ON events(artist_id, venue_id);
CREATE INDEX IF NOT EXISTS idx_followed_venues_user ON followed_venues(user_id);
CREATE INDEX IF NOT EXISTS idx_followed_artists_user ON followed_artists(user_id, artist_id); 