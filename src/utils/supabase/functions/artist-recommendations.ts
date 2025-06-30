import { createAdminClient } from '@/utils/supabase/admin-client';
import { Artist } from '@/types/index';

/**
 * Get artist recommendations based on a user's followed artists
 * This algorithm uses a combination of:
 * 1. Artists that performed at the same venues as followed artists
 * 2. Artists with similar names/genres (if available)
 * 3. Popular artists that the user doesn't follow yet
 * 
 * @param userId The user ID to get recommendations for
 * @param limit The maximum number of recommendations to return
 * @returns An array of recommended artists
 */
export async function getArtistRecommendations(userId: string, limit: number = 5): Promise<Artist[]> {
  const supabase = createAdminClient();
  
  try {
    // Step 1: Get the user's followed artists
    const { data: followedArtists, error: followedError } = await supabase
      .from('followed_artists')
      .select('artist_id')
      .eq('user_id', userId);
    
    if (followedError) {
      console.error('Error fetching followed artists:', followedError);
      return [];
    }
    
    // If user doesn't follow any artists, return popular ones
    if (!followedArtists || followedArtists.length === 0) {
      return getPopularArtists(limit);
    }
    
    const followedArtistIds = followedArtists.map(fa => fa.artist_id);
    
    // Skip SQL function call and use the manual implementation directly
    // Get venues the user follows
    const { data: followedVenues, error: venuesError } = await supabase
      .from('followed_venues')
      .select('venue_id')
      .eq('user_id', userId);
    
    if (venuesError || !followedVenues || followedVenues.length === 0) {
      // If no followed venues, return popular artists
      return getPopularArtists(limit, followedArtistIds);
    }
    
    const followedVenueIds = followedVenues.map(fv => fv.venue_id);
    
    // Find artists that have performed at those venues
    const { data: venueArtists, error: artistsError } = await supabase
      .from('events')
      .select('artist_id, venue_id, artists(id, name, created_at)')
      .in('venue_id', followedVenueIds)
      .not('artist_id', 'in', `(${followedArtistIds.join(',')})`)
      .not('artist_id', 'is', null);
    
    if (artistsError || !venueArtists || venueArtists.length === 0) {
      // If no artists found, return popular artists
      return getPopularArtists(limit, followedArtistIds);
    }
    
    // Count artist appearances and sort by frequency
    const artistCounts: { [key: string]: { count: number, artist: Artist } } = {};
    
    venueArtists.forEach(item => {
      if (item.artists && item.artist_id) {
        const artistData = item.artists as unknown as Artist;
        if (!artistCounts[item.artist_id]) {
          artistCounts[item.artist_id] = { 
            count: 1, 
            artist: artistData
          };
        } else {
          artistCounts[item.artist_id].count += 1;
        }
      }
    });
    
    // Convert to array and sort by count
    const sortedArtists = Object.values(artistCounts)
      .sort((a, b) => b.count - a.count)
      .map(item => item.artist)
      .slice(0, limit);
    
    if (sortedArtists.length >= limit) {
      return sortedArtists;
    }
    
    // If we don't have enough recommendations, add some popular artists
    if (sortedArtists.length < limit) {
      const additionalArtists = await getPopularArtists(limit - sortedArtists.length, followedArtistIds);
      return [...sortedArtists, ...additionalArtists];
    }
    
    return sortedArtists;
  } catch (error) {
    console.error('Error in artist recommendations:', error);
    return getPopularArtists(limit);
  }
}

/**
 * Get popular artists that the user doesn't follow
 * @param limit Maximum number of artists to return
 * @param excludeArtistIds Optional array of artist IDs to exclude
 * @returns Array of popular artists
 */
async function getPopularArtists(limit: number = 5, excludeArtistIds: string[] = []): Promise<Artist[]> {
  const supabase = createAdminClient();
  
  try {
    // For now, we'll just get random artists as a fallback
    // In a real app, you'd have a popularity score or event count to sort by
    const query = supabase
      .from('artists')
      .select('*')
      .order('created_at', { ascending: false });
    
    // If we have artist IDs to exclude, add that condition
    if (excludeArtistIds.length > 0) {
      query.not('id', 'in', `(${excludeArtistIds.join(',')})`);
    }
    
    // Get more than we need to ensure we have enough after filtering
    query.limit(limit * 2);
    
    const { data: artists, error } = await query;
    
    if (error) {
      console.error('Error fetching popular artists:', error);
      return [];
    }
    
    // Double-check to make sure no followed artists are included
    const filteredArtists = artists ? 
      artists.filter(artist => !excludeArtistIds.includes(artist.id)) : 
      [];
    
    return filteredArtists.slice(0, limit);
  } catch (error) {
    console.error('Error in getPopularArtists:', error);
    return [];
  }
} 