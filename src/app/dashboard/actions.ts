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
      // Add retry logic for reliability
      const maxRetries = 2;
      let retryCount = 0;
      let lastError: unknown;
      
      while (retryCount <= maxRetries) {
        try {
          console.log(`Scrape attempt ${retryCount + 1} of ${maxRetries + 1} for ${url}`);
          events = await firecrawlService.crawlConcertVenue(url, config);
          
          // Break the loop if successful
          if (events && events.length > 0) {
            break;
          }
          
          console.log('No events found, retrying...');
          retryCount++;
        } catch (retryError) {
          lastError = retryError;
          console.log(`Attempt ${retryCount + 1} failed:`, retryError);
          
          // Only retry if it's a timeout or server error
          if (retryError instanceof Error && 
              (retryError.message.includes('timeout') || 
               retryError.message.includes('500') ||
               retryError.message.includes('503'))) {
            retryCount++;
            
            if (retryCount <= maxRetries) {
              // Wait a bit longer between retries
              const delay = retryCount * 2000; // 2 seconds, 4 seconds
              console.log(`Waiting ${delay}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          } else {
            // Don't retry for other types of errors
            throw retryError;
          }
        }
      }
      
      // If we've exhausted all retries and still have no events, throw the last error
      if ((!events || events.length === 0) && lastError) {
        throw lastError;
      }
      
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
      
      if (scrapeError instanceof Error) {
        if (scrapeError.message.includes('timeout')) {
          errorMessage += ' The page took too long to respond. You might try again later when the site is less busy.';
        } else if (scrapeError.message.includes('500')) {
          errorMessage += ' The service is currently experiencing high load. Please try again in a few minutes.';
        }
      }
      
      return { error: errorMessage };
    }
    
    // Use DataPersistenceService to save the data
    const persistenceService = new DataPersistenceService();

    try {
      // Only attempt to save if we have events
      if (events && events.length > 0) {
        // Try Supabase first, but if it fails (artist_id issues), fall back to JSON-only
        try {
          if (storageOptions.saveToSupabase && venueId) {
            await persistenceService.saveScrapedEvents(url, events, storageOptions, venueId, venueName);
          } else {
            // Just save to JSON file
            const jsonOnlyOptions = { ...storageOptions, saveToSupabase: false };
            await persistenceService.saveScrapedEvents(url, events, jsonOnlyOptions, venueId, venueName);
          }
        } catch (supabaseError) {
          console.error('Error saving to Supabase, falling back to JSON-only:', supabaseError);
          
          // Fallback: Save to JSON only
          const jsonOnlyOptions = { ...storageOptions, saveToSupabase: false };
          await persistenceService.saveScrapedEvents(url, events, jsonOnlyOptions, venueId, venueName);
          
          // Update message to user
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
              eventsCount: events.length,
              warningMessage: 'Could not save to Supabase due to database constraints. Data was saved to JSON file only.'
            }
          };
        }
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