import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Define interfaces for type safety
interface Artist {
  id: string;
  name: string;
  genre: string | null;
  image_url: string | null;
}

interface FollowedArtistResponse {
  artists: {
    genre: string | null;
  };
}

interface FollowedArtistId {
  artist_id: string;
}

// Main server logic
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Ensure the request body has the expected shape
    const { userId }: { userId: string } = await req.json();
    if (!userId) {
      throw new Error('User ID is required.');
    }

    // Initialize Supabase client
    const supabase: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Get genres of artists the user follows
    const { data: followedArtists, error: followedError } = await supabase
      .from('followed_artists')
      .select('artists(genre)')
      .eq('user_id', userId);

    if (followedError) {
      throw followedError;
    }

    // Extract unique genres, filtering out any nulls
    const followedGenres = [
      ...new Set(
        (followedArtists as FollowedArtistResponse[])
          .map((fa) => fa.artists?.genre)
          .filter((genre): genre is string => !!genre)
      ),
    ];

    // If the user follows no artists with genres, return empty
    if (followedGenres.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 2. Get the IDs of all artists the user follows to exclude them from recommendations
    const { data: followedArtistIdsData, error: followedIdsError } = await supabase
      .from('followed_artists')
      .select('artist_id')
      .eq('user_id', userId);

    if (followedIdsError) {
      throw followedIdsError;
    }
    const followedArtistIds = (followedArtistIdsData as FollowedArtistId[]).map((fa) => fa.artist_id);

    // 3. Find new artists with the same genres
    const { data: recommendedArtists, error: recommendedError } = await supabase
      .from('artists')
      .select('id, name, genre, image_url')
      .in('genre', followedGenres)
      .not('id', 'in', `(${followedArtistIds.join(',')})`)
      .limit(10);

    if (recommendedError) {
      throw recommendedError;
    }

    // Return the list of recommended artists
    return new Response(JSON.stringify(recommendedArtists as Artist[]), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // Generic error handler
    const err = error as Error;
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
}); 