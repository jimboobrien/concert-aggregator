import { createAdminClient } from './supabase/admin-client';
import { ScrapedData } from '@/types';

/**
 * Checks if a URL has been scraped recently and returns the cached data if available
 * @param url The URL to check
 * @param maxAge Maximum age of the cached data in hours (default: 36)
 * @returns The cached data if available, null otherwise
 */
export async function getCachedScrapeData(url: string, maxAge: number = 36): Promise<ScrapedData | null> {
  try {
    const supabase = createAdminClient();
    
    // Check if we have a recent scrape for this URL
    const { data } = await supabase
      .from('scraped_urls')
      .select('cached_data, last_scraped_at, venue_id')
      .eq('url', url)
      .order('last_scraped_at', { ascending: false })
      .limit(1)
      .single();
    
    if (!data || !data.cached_data) {
      return null;
    }
    
    // Check if the cached data is still valid
    const lastScrapedAt = new Date(data.last_scraped_at);
    const now = new Date();
    const hoursSinceLastScrape = (now.getTime() - lastScrapedAt.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastScrape > maxAge) {
      console.log(`Cached data for ${url} is too old (${hoursSinceLastScrape.toFixed(1)} hours), fetching fresh data`);
      return null;
    }
    
    console.log(`Using cached data for ${url} (${hoursSinceLastScrape.toFixed(1)} hours old)`);
    
    // Add the venue ID to the metadata if available
    if (data.venue_id && data.cached_data.metadata) {
      data.cached_data.metadata.venueId = data.venue_id;
    }
    
    return data.cached_data as ScrapedData;
  } catch (error) {
    console.error('Error checking for cached scrape data:', error);
    return null;
  }
}

/**
 * Caches scraped data for a URL
 * @param url The URL that was scraped
 * @param data The scraped data
 * @param venueId The ID of the venue (optional)
 * @param expiresInHours How many hours until the cache expires (default: 36)
 */
export async function cacheScrapeData(
  url: string, 
  data: ScrapedData, 
  venueId?: string,
  expiresInHours: number = 36
): Promise<void> {
  try {
    const supabase = createAdminClient();
    
    // Check if we already have a record for this URL
    const { data: existingRecord } = await supabase
      .from('scraped_urls')
      .select('id, venue_id')
      .eq('url', url)
      .limit(1)
      .single();
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);
    
    if (existingRecord) {
      // Update the existing record
      await supabase
        .from('scraped_urls')
        .update({
          cached_data: data,
          venue_id: venueId || existingRecord.venue_id,
          expires_at: expiresAt.toISOString()
        })
        .eq('id', existingRecord.id);
      
      console.log(`Updated cached data for ${url}`);
    } else {
      // Create a new record
      await supabase
        .from('scraped_urls')
        .insert({
          url,
          venue_id: venueId,
          cached_data: data,
          expires_at: expiresAt.toISOString()
        });
      
      console.log(`Cached data for ${url}`);
    }
  } catch (error) {
    console.error('Error caching scrape data:', error);
    // Don't throw an error, just log it - we don't want to fail the scrape if caching fails
  }
} 