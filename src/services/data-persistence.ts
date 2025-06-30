import * as fs from 'fs';
import path from 'path';
import { ScrapedData, StorageOptions, ConcertEvent } from '../types';
import { createAdminClient } from '@/utils/supabase/admin-client';
import { formatScrapedData, prepareForSupabase } from '@/utils/format-scraped-data';
import { ScrapedEvent } from '@/types/scraping';
import { findOrCreateVenue, recordVenueScrape } from '@/utils/venue-utils';
import { findOrCreateArtist } from '@/utils/artist-utils';

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
      await fs.promises.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      console.error('Error creating data directory:', error);
      throw new Error('Could not create data directory.');
    }
  }

  /**
   * Generate a consistent filename based on the URL and timestamp
   * Format: YYYY_MM_DD_HH:MM:SS_hostname_state.json (e.g., 2025_06_25_04:09:51_thecaverns_ga.json)
   */
  private generateFilename(url: string, venueName?: string): string {
    // State detection map: key is the state abbreviation, values are patterns to check for
    const statePatterns: Record<string, string[]> = {
      'al': ['alabama', ' al ', ' al,', ' al.', ' al$'],
      'ak': ['alaska', ' ak ', ' ak,', ' ak.', ' ak$'],
      'az': ['arizona', ' az ', ' az,', ' az.', ' az$', 'phoenix', 'tucson', 'scottsdale'],
      'ar': ['arkansas', ' ar ', ' ar,', ' ar.', ' ar$'],
      'ca': ['california', ' ca ', ' ca,', ' ca.', ' ca$', 'los angeles', 'san francisco', 'san diego', 'sacramento'],
      'co': ['colorado', ' co ', ' co,', ' co.', ' co$', 'denver', 'boulder', 'aspen'],
      'ct': ['connecticut', ' ct ', ' ct,', ' ct.', ' ct$'],
      'de': ['delaware', ' de ', ' de,', ' de.', ' de$'],
      'fl': ['florida', ' fl ', ' fl,', ' fl.', ' fl$', 'miami', 'orlando', 'tampa'],
      'ga': ['georgia', ' ga ', ' ga,', ' ga.', ' ga$', 'atlanta', 'savannah', 'athens'],
      'hi': ['hawaii', ' hi ', ' hi,', ' hi.', ' hi$'],
      'id': ['idaho', ' id ', ' id,', ' id.', ' id$'],
      'il': ['illinois', ' il ', ' il,', ' il.', ' il$', 'chicago'],
      'in': ['indiana', ' in ', ' in,', ' in.', ' in$', 'indianapolis'],
      'ia': ['iowa', ' ia ', ' ia,', ' ia.', ' ia$'],
      'ks': ['kansas', ' ks ', ' ks,', ' ks.', ' ks$'],
      'ky': ['kentucky', ' ky ', ' ky,', ' ky.', ' ky$', 'louisville', 'lexington'],
      'la': ['louisiana', ' la ', ' la,', ' la.', ' la$', 'new orleans', 'baton rouge'],
      'me': ['maine', ' me ', ' me,', ' me.', ' me$'],
      'md': ['maryland', ' md ', ' md,', ' md.', ' md$', 'baltimore'],
      'ma': ['massachusetts', ' ma ', ' ma,', ' ma.', ' ma$', 'boston'],
      'mi': ['michigan', ' mi ', ' mi,', ' mi.', ' mi$', 'detroit', 'ann arbor'],
      'mn': ['minnesota', ' mn ', ' mn,', ' mn.', ' mn$', 'minneapolis'],
      'ms': ['mississippi', ' ms ', ' ms,', ' ms.', ' ms$'],
      'mo': ['missouri', ' mo ', ' mo,', ' mo.', ' mo$', 'st. louis', 'kansas city'],
      'mt': ['montana', ' mt ', ' mt,', ' mt.', ' mt$'],
      'ne': ['nebraska', ' ne ', ' ne,', ' ne.', ' ne$'],
      'nv': ['nevada', ' nv ', ' nv,', ' nv.', ' nv$', 'las vegas', 'reno'],
      'nh': ['new hampshire', ' nh ', ' nh,', ' nh.', ' nh$'],
      'nj': ['new jersey', ' nj ', ' nj,', ' nj.', ' nj$'],
      'nm': ['new mexico', ' nm ', ' nm,', ' nm.', ' nm$', 'santa fe', 'albuquerque'],
      'ny': ['new york', ' ny ', ' ny,', ' ny.', ' ny$', 'nyc', 'brooklyn', 'manhattan'],
      'nc': ['north carolina', ' nc ', ' nc,', ' nc.', ' nc$', 'charlotte', 'raleigh', 'asheville'],
      'nd': ['north dakota', ' nd ', ' nd,', ' nd.', ' nd$'],
      'oh': ['ohio', ' oh ', ' oh,', ' oh.', ' oh$', 'cleveland', 'columbus', 'cincinnati'],
      'ok': ['oklahoma', ' ok ', ' ok,', ' ok.', ' ok$'],
      'or': ['oregon', ' or ', ' or,', ' or.', ' or$', 'portland'],
      'pa': ['pennsylvania', ' pa ', ' pa,', ' pa.', ' pa$', 'philadelphia', 'pittsburgh'],
      'ri': ['rhode island', ' ri ', ' ri,', ' ri.', ' ri$', 'providence'],
      'sc': ['south carolina', ' sc ', ' sc,', ' sc.', ' sc$', 'charleston'],
      'sd': ['south dakota', ' sd ', ' sd,', ' sd.', ' sd$'],
      'tn': ['tennessee', ' tn ', ' tn,', ' tn.', ' tn$', 'nashville', 'memphis', 'knoxville'],
      'tx': ['texas', ' tx ', ' tx,', ' tx.', ' tx$', 'austin', 'dallas', 'houston', 'san antonio'],
      'ut': ['utah', ' ut ', ' ut,', ' ut.', ' ut$', 'salt lake city'],
      'vt': ['vermont', ' vt ', ' vt,', ' vt.', ' vt$'],
      'va': ['virginia', ' va ', ' va,', ' va.', ' va$', 'richmond'],
      'wa': ['washington', ' wa ', ' wa,', ' wa.', ' wa$', 'seattle', 'tacoma', 'spokane'],
      'wv': ['west virginia', ' wv ', ' wv,', ' wv.', ' wv$'],
      'wi': ['wisconsin', ' wi ', ' wi,', ' wi.', ' wi$', 'milwaukee', 'madison'],
      'wy': ['wyoming', ' wy ', ' wy,', ' wy.', ' wy$']
    };

    // Extract hostname from URL
    const hostname = new URL(url).hostname;
    // Remove www. and .com/.org/etc from hostname
    const cleanHostname = hostname.replace(/^www\./, '').replace(/\.(com|org|net|io|gov)$/, '');
    
    // Get current date and time for the filename
    const date = new Date();
    const year = date.getFullYear();
    // Add leading zero if month/day is single digit
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Add time components with leading zeros
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    // Default state code
    let stateCode = 'ga';
    
    // If we have venue information, try to extract state from it
    if (venueName) {
      const lowerVenueName = venueName.toLowerCase();
      
      // Check each state's patterns
      for (const [state, patterns] of Object.entries(statePatterns)) {
        if (patterns.some(pattern => lowerVenueName.includes(pattern))) {
          stateCode = state;
          break;
        }
      }
    }
    
    // Also try to detect state from the URL
    const urlString = url.toLowerCase();
    for (const [state, patterns] of Object.entries(statePatterns)) {
      if (patterns.some(pattern => urlString.includes(pattern))) {
        stateCode = state;
        break;
      }
    }
    
    // Format: YYYY_MM_DD_HH:MM:SS_hostname_state.json
    return `${year}_${month}_${day}_${hours}-${minutes}-${seconds}_${cleanHostname}_${stateCode}.json`;
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
        await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
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
        
        await fs.promises.writeFile(filePath, JSON.stringify(wrappedData, null, 2), 'utf-8');
      } else {
        // Data is already in our format, save it directly
        await fs.promises.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf-8');
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

  /**
   * Save scraped data to a JSON file
   */
  async saveToJson(data: ScrapedData, options: { fileName: string; outputDir?: string }): Promise<string> {
    const { fileName, outputDir = 'scraped-data' } = options;
    
    // Ensure the output directory exists
    const fullOutputDir = path.join(process.cwd(), outputDir);
    if (!fs.existsSync(fullOutputDir)) {
      fs.mkdirSync(fullOutputDir, { recursive: true });
    }
    
    // Create the full file path
    const filePath = path.join(fullOutputDir, `${fileName}.json`);
    
    // Write the data to the file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    
    return filePath;
  }
  
  /**
   * Save scraped data to Supabase
   */
  async saveToSupabase(data: ScrapedData, options: { venueId?: string }): Promise<{ venueId: string; eventsCount: number }> {
    const supabase = createAdminClient();
    const { venueId: existingVenueId } = options;
    
    let venueId = existingVenueId;
    let venueName: string | undefined;
    
    // If no venue ID was provided, try to extract it from the URL
    if (!venueId) {
      try {
        // Use the findOrCreateVenue utility to get or create a venue
        const venueResult = await findOrCreateVenue(data.url);
        venueId = venueResult.id;
        venueName = venueResult.name;
        
        console.log(`${venueResult.isNew ? 'Created new' : 'Found existing'} venue: ${venueResult.name} (${venueId})`);
      } catch (error) {
        console.error('Error finding/creating venue:', error);
        throw new Error('Failed to find or create venue');
      }
    }
    
    if (!venueId) {
      throw new Error('Venue ID is required to save events to Supabase');
    }
    
    // Get all events from the scraped data
    const events = data.json?.events || [];
    if (events.length === 0) {
      console.log('No events found in scraped data');
      return { venueId, eventsCount: 0 };
    }
    
    // Get venue name for artist name cleaning
    if (!venueName) {
      const { data: venueData } = await supabase
        .from('venues')
        .select('name')
        .eq('id', venueId)
        .single();
      
      venueName = venueData?.name;
    }
    
    // Process each event
    let eventsCount = 0;
    for (const event of events) {
      try {
        // Clean and find/create the artist
        const artistResult = await findOrCreateArtist(event.title, venueName ? [venueName] : []);
        
        // Format the date
        let eventDate: string;
        try {
          const date = new Date(event.date);
          eventDate = date.toISOString();
        } catch (error) {
          console.error('Invalid date format:', event.date, error);
          eventDate = new Date().toISOString(); // Fallback to current date
        }
        
        // Insert the event
        const { error } = await supabase
          .from('events')
          .insert({
            title: event.title,
            date: eventDate,
            venue_id: venueId,
            artist_id: artistResult.id,
            ticket_url: event.url,
            scraped_at: new Date().toISOString()
          });
        
        if (error) {
          console.error('Error inserting event:', error);
        } else {
          eventsCount++;
        }
      } catch (eventError) {
        console.error('Error processing event:', eventError);
      }
    }
    
    // Record the scrape in the venue_scrape_history table
    await recordVenueScrape(venueId, data.url, eventsCount);
    
    return { venueId, eventsCount };
  }
  
  /**
   * Save scraped data according to the provided options
   */
  async saveData(data: ScrapedData, options: StorageOptions & { fileName: string; outputDir?: string; venueId?: string }): Promise<{
    filePath?: string;
    venueId?: string;
    eventsCount?: number;
  }> {
    const result: {
      filePath?: string;
      venueId?: string;
      eventsCount?: number;
    } = {};
    
    // Save to JSON file if requested
    if (options.saveToJson) {
      result.filePath = await this.saveToJson(data, {
        fileName: options.fileName,
        outputDir: options.outputDir
      });
    }
    
    // Save to Supabase if requested
    if (options.saveToSupabase) {
      const supabaseResult = await this.saveToSupabase(data, {
        venueId: options.venueId
      });
      
      result.venueId = supabaseResult.venueId;
      result.eventsCount = supabaseResult.eventsCount;
    }
    
    return result;
  }
} 