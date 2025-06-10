'use server'

import { FirecrawlService } from '@/services/firecrawl';
import { DataPersistenceService } from '@/services/data-persistence';
import { ScrapedData, StorageOptions } from '@/types';
import { CrawlConfig } from '@/types/scraping';
import { createAdminClient } from '@/utils/supabase/admin-client';

export async function getScrapeData(
  url: string,
  storageOptions: StorageOptions = { saveToJson: true, saveToSupabase: false },
  venueId?: string,
  venueName?: string
): Promise<ScrapedData | { error: string }> {
  try {
    const firecrawlService = new FirecrawlService();
    
    // Check if this is a known problematic URL
    const isProblematicSite = /thecaverns\.com|otherProblemSite\.com/i.test(url);
    
    // Create a more specific prompt for known problematic sites
    let prompt = 'Extract all concert and event information from this page, including title, date, and any available ticket URLs.';
    
    if (isProblematicSite) {
      prompt = 'This is a concert venue page. Extract all upcoming shows/concerts with their title/artist name, date (MM/DD/YYYY format if possible), and ticket URL if available. Look for common concert listing patterns like dates followed by artist names.';
      console.log(`Using specialized prompt for problematic site: ${url}`);
    }
    
    // Default to a generic AI prompt for now
    const config: CrawlConfig = {
      mode: 'ai_prompt',
      prompt
    };

    // Scrape the data using FirecrawlService
    let events;
    try {
      events = await firecrawlService.crawlConcertVenue(url, config);
      
      // Validate we actually have events to save
      if (!events || events.length === 0) {
        console.error('No events found in scraping result');
        
        let errorMessage = 'No events found on the page. The venue may have changed their website structure or there may be no upcoming events.';
        
        if (isProblematicSite) {
          errorMessage += ' This site is known to be difficult to scrape. You may need to manually check the venue website.';
        }
        
        return { error: errorMessage };
      }
      
    } catch (scrapeError) {
      console.error('Error during crawl:', scrapeError);
      
      let errorMessage = `Scraping failed: ${scrapeError instanceof Error ? scrapeError.message : String(scrapeError)}`;
      
      if (isProblematicSite) {
        errorMessage += ' This site is known to have complex structure that can be difficult to scrape.';
      }
      
      if (scrapeError instanceof Error && scrapeError.message.includes('timeout')) {
        errorMessage += ' The page took too long to respond. You might try again later when the site is less busy.';
      }
      
      return { error: errorMessage };
    }
    
    // Use DataPersistenceService to save the data
    const persistenceService = new DataPersistenceService();

    try {
      // Only attempt to save if we have events
      if (events && events.length > 0) {
        await persistenceService.saveScrapedEvents(url, events, storageOptions, venueId, venueName);
      } else {
        return { error: 'No events found to save' };
      }
    } catch (saveError) {
      console.error('Error saving data:', saveError);
      let errorMsg = `Failed to save scraped data: ${saveError instanceof Error ? saveError.message : String(saveError)}`;
      
      // Provide more helpful error messages for common issues
      if (saveError instanceof Error) {
        if (saveError.message.includes('duplicate')) {
          errorMsg = 'Some events may already exist in the database. Try with different options or check existing data.';
        } else if (saveError.message.includes('permission')) {
          errorMsg = 'Permission error when saving data. You may need admin privileges to save to this location.';
        }
      }
      
      return { error: errorMsg };
    }

    // Return the formatted data
    return {
      url,
      timestamp: new Date().toISOString(),
      json: {
        events,
      },
      markdown: null,
      metadata: {
        source: url,
        venueId,
        venueName,
        eventsCount: events.length
      }
    };
  } catch (error) {
    console.error('Unexpected error in getScrapeData:', error);
    return { 
      error: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

export async function getVenues() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('venues')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching venues:', error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Error in getVenues:', error);
    return [];
  }
}

export async function addVenue(name: string) {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('venues')
      .insert({ name })
      .select()
      .single();

    if (error) {
      console.error('Error adding venue:', error);
      return { error: 'Failed to add new venue.' };
    }

    return data;
  } catch (error) {
    console.error('Error in addVenue:', error);
    return { error: 'An unexpected error occurred while adding the venue.' };
  }
} 