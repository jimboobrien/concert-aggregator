import { ScrapedEvent } from '@/types/scraping';
import { ScrapedData, ConcertEvent } from '@/types';

/**
 * Standardizes scraped data to ensure consistency between file storage and database storage
 * Follows the format used in www.thecaverns.com-1749363091409.json
 */
export function formatScrapedData(
  url: string,
  events: ScrapedEvent[],
  venueName?: string
): ScrapedData {
  // Transform events to the desired format
  const formattedEvents: ConcertEvent[] = events.map((event) => ({
    title: event.title,
    date: event.date,
    venue: venueName || new URL(url).hostname.replace('www.', ''),
    url: event.ticketUrl || '',
  }));

  // Create the standardized structure
  const standardizedData: ScrapedData = {
    url,
    timestamp: new Date().toISOString(),
    metadata: {
      scrapeId: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sourceURL: url,
      url: url,
    },
    json: {
      events: formattedEvents
    },
    markdown: null
  };

  return standardizedData;
}

/**
 * Converts a standard ScrapedData object into a format suitable for Supabase insertion
 * 
 * The format returned matches the Supabase events table structure:
 * - title: The event title
 * - event_date: ISO formatted date
 * - url: URL to the event/ticket page
 * - venue_id: Foreign key to venues table
 * - artist_id: Foreign key to artists table (currently using a default UUID)
 * - description: Event description (null for now)
 */
export function prepareForSupabase(
  data: ScrapedData,
  venueId?: string
): Array<{
  title: string;
  event_date: string;
  url: string | null;
  venue_id: string | undefined;
  artist_id: string;
  description: null;
}> {
  if (!data.json?.events) {
    return [];
  }

  // This UUID format is expected by PostgreSQL for INSERT operations
  // We're using a "known" UUID (v4 format) which we'll need to create if it doesn't exist
  // The corresponding artist should be created before importing events
  const defaultArtistId = 'c0a80121-7ac6-4745-b000-f95544c77ed2'; // "Unknown Artist" ID

  return data.json.events.map((event) => ({
    title: event.title,
    event_date: new Date(event.date).toISOString(),
    url: event.url || null,
    venue_id: venueId,
    artist_id: defaultArtistId, // Using a known artist ID until the migration to make this nullable is applied
    description: null,
  }));
} 