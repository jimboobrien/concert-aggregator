import fs from 'fs/promises';
import path from 'path';
import { ScrapedData, StorageOptions, ConcertEvent } from '../types';
import { createAdminClient } from '@/utils/supabase/admin-client';
import { formatScrapedData, prepareForSupabase } from '@/utils/format-scraped-data';
import { ScrapedEvent } from '@/types/scraping';

// Define a type that represents potential JSON data we might receive
type RawJsonData = {
  url?: string;
  timestamp?: string;
  json?: {
    events?: ConcertEvent[];
  };
  events?: ConcertEvent[];
} | ConcertEvent[];

export class DataPersistenceService {
  private dataDir: string;
  private supabase;

  constructor(customDataDir?: string) {
    // Allow custom data directory for testing or user preferences
    this.dataDir = customDataDir || path.join(process.cwd(), 'scraped-data');
    // Use the admin client for database operations
    this.supabase = createAdminClient();
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      console.error('Error creating data directory:', error);
      throw new Error('Could not create data directory.');
    }
  }

  /**
   * Generate a consistent filename based on the URL and timestamp
   * Format: YYYY_MM_DD_hostname_state.json (e.g., 2025_06_25_thecaverns_ga.json)
   */
  private generateFilename(url: string, venueName?: string): string {
    // Extract hostname from URL
    const hostname = new URL(url).hostname;
    // Remove www. and .com/.org/etc from hostname
    const cleanHostname = hostname.replace(/^www\./, '').replace(/\.(com|org|net|io|gov)$/, '');
    
    // Get current date for the filename
    const date = new Date();
    const year = date.getFullYear();
    // Add leading zero if month/day is single digit
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Default state code - could be enhanced to determine from URL or venue data
    let stateCode = 'ga';
    
    // If we have venue information, try to extract state from it
    if (venueName) {
      const lowerVenueName = venueName.toLowerCase();
      
      // Check for state names or abbreviations in venue name
      if (lowerVenueName.includes('georgia') || lowerVenueName.includes(' ga ') || lowerVenueName.endsWith(' ga')) {
        stateCode = 'ga';
      } else if (lowerVenueName.includes('tennessee') || lowerVenueName.includes(' tn ') || lowerVenueName.endsWith(' tn')) {
        stateCode = 'tn';
      } else if (lowerVenueName.includes('north carolina') || lowerVenueName.includes(' nc ') || lowerVenueName.endsWith(' nc')) {
        stateCode = 'nc';
      }
      // Add more state checks as needed
    }
    
    return `${year}_${month}_${day}_${cleanHostname}_${stateCode}.json`;
  }

  /**
   * Save ScrapedData directly to file and/or Supabase
   */
  async save(data: ScrapedData, options: StorageOptions, venueId?: string, venueName?: string): Promise<string> {
    let savePath = 'No file saved.';
    const saveErrors = [];
    let savedSomewhere = false;

    // Always try to save to JSON if requested
    if (options.saveToJson) {
      try {
        await this.ensureDirectoryExists();
        const filename = this.generateFilename(data.url, venueName);
        const filePath = path.join(this.dataDir, filename);

        // We're using the already formatted data directly
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
        savePath = filePath;
        savedSomewhere = true;
        console.log(`Successfully saved data to ${filePath}`);
      } catch (error) {
        console.error(`Error saving data to ${this.dataDir}:`, error);
        saveErrors.push(`JSON save error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Try to save to Supabase if requested, but don't fail the entire operation
    if (options.saveToSupabase && data.json?.events && venueId) {
      try {
        // Use the prepareForSupabase utility to format data for Supabase
        const eventsToSave = prepareForSupabase(data, venueId);
        
        const { error } = await this.supabase
          .from('events')
          .upsert(eventsToSave);

        if (error) {
          console.error('Error saving data to Supabase:', error);
          saveErrors.push(`Supabase error: ${error.message}`);
        } else {
          console.log('Successfully saved events to Supabase.');
          savedSomewhere = true;
        }
      } catch (error) {
        console.error('Error saving data to Supabase:', error);
        saveErrors.push(`Supabase error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Only throw if we couldn't save anywhere
    if (!savedSomewhere && saveErrors.length > 0) {
      throw new Error(`Could not save data: ${saveErrors.join(', ')}`);
    }

    return savePath;
  }
  
  /**
   * Process and save scraped events from FirecrawlService
   */
  async saveScrapedEvents(
    url: string,
    events: ScrapedEvent[],
    options: StorageOptions,
    venueId?: string,
    venueName?: string
  ): Promise<string> {
    // Validate that we have actual events to save
    if (!events || events.length === 0) {
      console.warn('No events to save. Skipping persistence.');
      return 'No data saved: empty events array.';
    }
    
    // Format the scraped events to our standardized structure
    const formattedData = formatScrapedData(url, events, venueName);
    
    // Additional validation to ensure we have proper data
    if (!formattedData.json?.events || formattedData.json.events.length === 0) {
      console.warn('Formatted data contains no events. Skipping persistence.');
      return 'No data saved: formatting resulted in empty events.';
    }
    
    // Use the existing save method with the formatted data
    return this.save(formattedData, options, venueId, venueName);
  }
  
  /**
   * Save raw JSON data directly to a file with our standard format
   */
  async saveRawJsonToFile(
    url: string, 
    jsonData: RawJsonData,
    customFilename?: string,
    venueName?: string
  ): Promise<string> {
    await this.ensureDirectoryExists();
    
    // Use custom filename if provided, otherwise generate one
    const filename = customFilename || this.generateFilename(url, venueName);
    const filePath = path.join(this.dataDir, filename);
    
    try {
      // Wrap the JSON data in our standard format if it's not already
      if (!('url' in jsonData && jsonData.url) || 
          !('timestamp' in jsonData && jsonData.timestamp) || 
          !('json' in jsonData && jsonData.json?.events)) {
        
        const wrappedData: ScrapedData = {
          url,
          timestamp: new Date().toISOString(),
          metadata: {
            sourceURL: url,
          },
          json: {
            events: Array.isArray(jsonData) 
              ? jsonData 
              : ('events' in jsonData && Array.isArray(jsonData.events)) 
                ? jsonData.events 
                : []
          },
          markdown: null
        };
        
        await fs.writeFile(filePath, JSON.stringify(wrappedData, null, 2), 'utf-8');
      } else {
        // Data is already in our format, save it directly
        await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf-8');
      }
      
      console.log(`Successfully saved JSON data to ${filePath}`);
      return filePath;
    } catch (error) {
      console.error(`Error saving JSON data to ${filePath}:`, error);
      throw new Error('Could not save JSON data to file.');
    }
  }

  /**
   * Save raw JSON data directly to Supabase with our standard format
   * This method handles the conversion from file format to database format
   */
  async saveJsonToSupabase(
    jsonData: RawJsonData,
    venueId: string,
    normalizeData: boolean = true
  ): Promise<number> {
    try {
      let standardizedData: ScrapedData;
      let url: string = '';
      
      // First, ensure we have properly formatted data
      if ('url' in jsonData && jsonData.url && 
          'timestamp' in jsonData && jsonData.timestamp && 
          'json' in jsonData && jsonData.json?.events) {
        // Data is already in our standard format
        standardizedData = jsonData as ScrapedData;
        url = jsonData.url;
      } else {
        // Wrap the data in our standard format
        url = ('url' in jsonData && jsonData.url) ? jsonData.url : 'unknown-source';
        
        standardizedData = {
          url,
          timestamp: new Date().toISOString(),
          metadata: {
            sourceURL: url,
            importedAt: new Date().toISOString()
          },
          json: {
            events: Array.isArray(jsonData) 
              ? jsonData 
              : ('events' in jsonData && Array.isArray(jsonData.events)) 
                ? jsonData.events 
                : []
          },
          markdown: null
        };
      }
      
      // Use the prepareForSupabase utility to format data for database insertion
      const eventsToSave = prepareForSupabase(standardizedData, venueId);
      
      // Skip if there are no events to save
      if (!eventsToSave.length) {
        console.warn('No events to save to Supabase.');
        return 0;
      }
      
      // Handle data normalization if needed
      const finalEvents = normalizeData 
        ? eventsToSave.map(event => {
            // Create a new object with normalized values
            return {
              ...event,
              // Ensure event_date is in proper ISO format
              event_date: new Date(event.event_date).toISOString(),
              // Safely handle string properties
              title: event.title,
              url: event.url,
              description: event.description
              // Remove metadata fields that don't exist in schema
            };
          })
        : eventsToSave;
      
      // Insert data into Supabase with conflict handling
      const { data, error } = await this.supabase
        .from('events')
        .upsert(finalEvents, {
          onConflict: 'venue_id,title,event_date',
          ignoreDuplicates: true
        })
        .select('id');
      
      if (error) {
        throw error;
      }
      
      const insertedCount = data?.length || 0;
      console.log(`Successfully saved ${insertedCount} events to Supabase.`);
      
      return insertedCount;
    } catch (error) {
      console.error('Error saving JSON data to Supabase:', error);
      throw new Error('Could not save JSON data to Supabase.');
    }
  }
} 