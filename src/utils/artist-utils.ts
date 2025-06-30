import { createAdminClient } from './supabase/admin-client';
import { cleanArtistName, checkArtistSimilarity } from './openrouter-client';

/**
 * Finds or creates an artist based on name
 * @param artistName The name of the artist
 * @param venueNames Optional array of venue names to help clean the artist name
 * @returns The artist object with id
 */
export async function findOrCreateArtist(
  artistName: string,
  venueNames: string[] = []
): Promise<{ id: string; name: string; isNew: boolean }> {
  if (!artistName || artistName.trim() === '') {
    throw new Error('Artist name is required');
  }

  const supabase = createAdminClient();
  
  // First, clean the artist name to remove venue references and normalize it
  try {
    const cleanResult = await cleanArtistName(artistName, venueNames);
    const cleanedName = cleanResult.cleanedName;
    
    // If the name appears to be a venue rather than an artist, we might want to skip it
    if (cleanResult.possibleVenue) {
      console.log(`"${artistName}" appears to be a venue name (${cleanResult.possibleVenue}), not an artist. Proceeding with caution.`);
    }
    
    // First try to find by exact match
    const { data: artistByExactName } = await supabase
      .from('artists')
      .select('id, name')
      .eq('name', cleanedName)
      .single();
    
    if (artistByExactName) {
      return { ...artistByExactName, isNew: false };
    }
    
    // Get all existing artist names for duplicate detection
    const { data: allArtists } = await supabase
      .from('artists')
      .select('name');
    
    const existingArtistNames = allArtists?.map(a => a.name) || [];
    
    // Check for duplicate artists using AI
    const similarityCheck = await checkArtistSimilarity(cleanedName, existingArtistNames);
    
    // If it's a duplicate with high confidence, find and return the existing artist
    if (similarityCheck.isDuplicate && similarityCheck.duplicateOf && similarityCheck.confidence && similarityCheck.confidence > 0.7) {
      console.log(`Detected duplicate artist: "${cleanedName}" is similar to "${similarityCheck.duplicateOf}" (confidence: ${similarityCheck.confidence})`);
      
      // Find the existing artist
      const { data: existingArtist } = await supabase
        .from('artists')
        .select('id, name')
        .ilike('name', similarityCheck.duplicateOf)
        .single();
      
      if (existingArtist) {
        return { ...existingArtist, isNew: false };
      }
    }
    
    // Use the normalized name from AI if available
    const finalName = similarityCheck.normalizedName || cleanedName;
    
    // Create a new artist
    const { data: newArtist, error: createError } = await supabase
      .from('artists')
      .insert({
        name: finalName,
      })
      .select('id, name')
      .single();
    
    if (createError) {
      console.error('Error creating artist:', createError);
      throw new Error(`Failed to create artist: ${createError.message}`);
    }
    
    return { ...newArtist, isNew: true };
  } catch (aiError) {
    console.error('Error with AI artist name processing:', aiError);
    
    // Fallback to simple exact match lookup
    const { data: artistByName } = await supabase
      .from('artists')
      .select('id, name')
      .eq('name', artistName)
      .single();
    
    if (artistByName) {
      return { ...artistByName, isNew: false };
    }
    
    // Create a new artist with the original name
    const { data: newArtist, error: fallbackError } = await supabase
      .from('artists')
      .insert({
        name: artistName,
      })
      .select('id, name')
      .single();
    
    if (fallbackError) {
      console.error('Error creating artist:', fallbackError);
      throw new Error(`Failed to create artist: ${fallbackError.message}`);
    }
    
    return { ...newArtist, isNew: true };
  }
}

/**
 * Batch process artist names from event titles
 * @param eventTitles Array of event titles that may contain artist names
 * @param venueNames Optional array of venue names to help clean the artist names
 * @returns Map of event titles to artist IDs
 */
export async function processEventArtists(
  eventTitles: string[],
  venueNames: string[] = []
): Promise<Map<string, string>> {
  const artistMap = new Map<string, string>();
  
  for (const title of eventTitles) {
    if (!title || title.trim() === '') {
      continue;
    }
    
    try {
      const artist = await findOrCreateArtist(title, venueNames);
      artistMap.set(title, artist.id);
    } catch (error) {
      console.error(`Error processing artist for event "${title}":`, error);
    }
  }
  
  return artistMap;
}

/**
 * Records a metric for an artist (view, search, etc.)
 * @param artistId The ID of the artist
 * @param metricType The type of metric to record
 * @param metadata Optional metadata to include with the metric
 */
export async function recordArtistMetric(
  artistId: string,
  metricType: 'view' | 'search' | 'venue_appearance',
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const supabase = createAdminClient();
  
  try {
    // Call the increment_artist_metric function
    const { error: metricError } = await supabase.rpc('increment_artist_metric', {
      artist_id_param: artistId,
      metric_type_param: metricType,
      increment_value: 1,
      metadata_param: metadata
    });
    
    if (metricError) {
      console.error(`Error recording ${metricType} metric for artist ${artistId}:`, metricError);
    }
  } catch (rpcError) {
    console.error(`Error recording ${metricType} metric for artist ${artistId}:`, rpcError);
    // Don't throw an error, just log it
  }
} 