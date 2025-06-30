-- Function to safely delete an artist and return the IDs of users who followed them.
-- This will be callable from our application via RPC.

CREATE OR REPLACE FUNCTION delete_artist_and_related_data(artist_id_to_delete uuid)
RETURNS TABLE(user_id uuid)
LANGUAGE plpgsql
AS $$
BEGIN
    -- First, find all users who followed the artist and return their IDs.
    -- The results will be returned at the end of the function.
    RETURN QUERY
    SELECT fa.user_id FROM public.followed_artists fa WHERE fa.artist_id = artist_id_to_delete;

    -- Delete related records to avoid foreign key constraint violations.

    -- Delete from the 'events' table
    DELETE FROM public.events WHERE artist_id = artist_id_to_delete;

    -- Delete from the 'followed_artists' table
    DELETE FROM public.followed_artists WHERE artist_id = artist_id_to_delete;
    
    -- Finally, delete the artist from the main 'artists' table.
    DELETE FROM public.artists WHERE id = artist_id_to_delete;

END;
$$;

-- Grant execute permission to the authenticated role
GRANT EXECUTE ON FUNCTION public.delete_artist_and_related_data(uuid) TO authenticated; 