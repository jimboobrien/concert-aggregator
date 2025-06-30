import { createAdminClient } from '@/utils/supabase/admin-client';
import { createClient } from '@/utils/supabase/client';

/**
 * Types of artist metrics we track
 */
export enum ArtistMetricType {
  VIEW = 'view',                     // Artist profile view
  SEARCH = 'search',                 // Artist searched for
  VENUE_APPEARANCE = 'venue_appearance', // Artist appears in venue results
}

/**
 * Track an artist metric
 * @param artistId The artist ID to track metrics for
 * @param metricType The type of metric to track
 * @param metadata Optional additional data about the metric
 * @param isServer Whether this is being called from server-side code
 */
export async function trackArtistMetric(
  artistId: string,
  metricType: ArtistMetricType,
  metadata: Record<string, unknown> = {},
  isServer: boolean = false
): Promise<void> {
  try {
    // Use the appropriate client based on context
    const supabase = isServer ? createAdminClient() : createClient();
    
    // Try to use the SQL function if available
    const { error: rpcError } = await supabase.rpc('increment_artist_metric', {
      artist_id_param: artistId,
      metric_type_param: metricType,
      increment_value: 1,
      metadata_param: metadata
    });
    
    // If the RPC fails, fall back to direct updates
    if (rpcError) {
      console.error('Error using increment_artist_metric RPC:', rpcError);
      
      // Insert into metrics table
      const { error: insertError } = await supabase
        .from('artist_metrics')
        .insert({
          artist_id: artistId,
          metric_type: metricType,
          value: 1,
          metadata: metadata
        });
      
      if (insertError) {
        console.error('Error inserting artist metric:', insertError);
      }
      
      // Update the summary column
      const columnToUpdate = 
        metricType === ArtistMetricType.VIEW ? 'view_count' :
        metricType === ArtistMetricType.SEARCH ? 'search_count' :
        metricType === ArtistMetricType.VENUE_APPEARANCE ? 'venue_appearance_count' : null;
      
      if (columnToUpdate) {
        const { error: updateError } = await supabase
          .from('artists')
          .update({ [columnToUpdate]: supabase.rpc('increment', { inc: 1 }) })
          .eq('id', artistId);
        
        if (updateError) {
          console.error(`Error updating ${columnToUpdate}:`, updateError);
        }
      }
    }
  } catch (error) {
    console.error('Unexpected error tracking artist metric:', error);
  }
}

/**
 * Track artist search metrics
 * @param query The search query
 * @param artistIds Array of artist IDs that matched the search
 * @param isServer Whether this is being called from server-side code
 */
export async function trackArtistSearch(
  query: string,
  artistIds: string[],
  isServer: boolean = false
): Promise<void> {
  // Track metrics for each artist that matched the search
  const promises = artistIds.map(artistId => 
    trackArtistMetric(
      artistId,
      ArtistMetricType.SEARCH,
      { query, position: artistIds.indexOf(artistId) + 1 },
      isServer
    )
  );
  
  await Promise.all(promises);
}

/**
 * Track artist view metrics
 * @param artistId The artist ID that was viewed
 * @param referrer Where the user came from (optional)
 * @param isServer Whether this is being called from server-side code
 */
export async function trackArtistView(
  artistId: string,
  referrer: string = '',
  isServer: boolean = false
): Promise<void> {
  await trackArtistMetric(
    artistId,
    ArtistMetricType.VIEW,
    { referrer },
    isServer
  );
}

/**
 * Track artist appearance in venue results
 * @param artistId The artist ID
 * @param venueId The venue ID where the artist appears
 * @param isServer Whether this is being called from server-side code
 */
export async function trackVenueAppearance(
  artistId: string,
  venueId: string,
  isServer: boolean = false
): Promise<void> {
  await trackArtistMetric(
    artistId,
    ArtistMetricType.VENUE_APPEARANCE,
    { venue_id: venueId },
    isServer
  );
} 