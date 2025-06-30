import FirecrawlApp from '@mendable/firecrawl-js';
import { z } from 'zod';
import { ScrapedData, CrawlConfig, ScrapedEvent, SelectorSchema, ConcertEvent } from '../types';

// Define the Zod schema for validation during extraction
const EventSchema = z.object({
  title: z.string(),
  date: z.string(),
  ticketUrl: z.string().optional(),
});

const ExtractionSchema = z.object({
  events: z.array(EventSchema),
});

// Schema for venue information extraction
const VenueInfoSchema = z.object({
  name: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string().optional(),
});

// Initialize the client once at module level for better performance
const firecrawlClient = new FirecrawlApp({ 
  apiKey: process.env.FIRECRAWL_API_KEY || '' 
});

export class FirecrawlService {
  private client: FirecrawlApp;

  constructor() {
    if (!process.env.FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY is not set');
    }
    // Use the shared client instance
    this.client = firecrawlClient;
  }

  async scrapeUrl(url: string): Promise<ScrapedData> {
    try {
      console.log(`Scraping URL: ${url} with default options`);
      const result = await this.client.scrapeUrl(url, {
        formats: ['markdown'],
        waitFor: 5000, // Wait for dynamic content to load
      });

      if ('error' in result) {
        const errorMsg = typeof result.error === 'string' 
          ? result.error 
          : JSON.stringify(result.error || 'Unknown error');
        console.error(`Error in scrapeUrl: ${errorMsg}`);
        throw new Error(errorMsg);
      }
      
      const scrapedJson = (result.json as { events: ConcertEvent[] }) || null;
      console.log('Scraped JSON:', scrapedJson);
      return {
        json: scrapedJson,
        markdown: result.markdown ?? null,
        url: url,
        timestamp: new Date().toISOString(),
        metadata: result.metadata ?? {},
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error scraping ${url}:`, error);
      throw new Error(`Failed to scrape ${url}: ${errorMessage}`);
    }
  }

  /**
   * Extract venue information (name, city, state) from a venue website
   * @param url The URL of the venue website
   * @returns Object containing venue name, city, and state (with state as 2-letter code)
   */
  async extractVenueInfo(url: string): Promise<{
    name: string;
    city: string;
    state: string;
    country?: string;
  }> {
    try {
      console.log(`Extracting venue information from: ${url}`);
      
      const prompt = `
        Extract the following information about this music venue:
        1. The official name of the venue
        2. The city where the venue is located
        3. The state where the venue is located (as a 2-letter abbreviation)
        4. The country (optional, default to "USA" if not specified)
        
        If any information is not available on the page, make your best guess based on the URL, 
        domain name, or any other available information. For the state, always return a valid 
        2-letter US state code (e.g., GA for Georgia, NY for New York).
      `;
      
      const response = await this.client.scrapeUrl(url, {
        formats: ['json'],
        jsonOptions: {
          schema: VenueInfoSchema,
          prompt
        },
        waitFor: 5000
      });
      
      if (response && 'json' in response) {
        console.log('Venue info extraction successful');
        // Parse and validate with Zod
        const venueInfo = VenueInfoSchema.parse(response.json);
        
        // Ensure state is uppercase and 2 letters
        const state = venueInfo.state.toUpperCase();
        const validState = state.length === 2 ? state : this.inferStateCode(state);
        
        return {
          name: venueInfo.name,
          city: venueInfo.city,
          state: validState,
          country: venueInfo.country || 'USA'
        };
      } else {
        console.error('Venue info extraction failed or returned unexpected data format');
        // Return default values based on URL
        const domain = new URL(url).hostname.replace('www.', '');
        return {
          name: this.formatDomainAsName(domain),
          city: 'Unknown',
          state: 'GA', // Default to Georgia
          country: 'USA'
        };
      }
    } catch (error) {
      console.error('Error during venue info extraction:', error);
      // Return default values based on URL as fallback
      try {
        const domain = new URL(url).hostname.replace('www.', '');
        return {
          name: this.formatDomainAsName(domain),
          city: 'Unknown',
          state: 'GA', // Default to Georgia
          country: 'USA'
        };
      } catch {
        return {
          name: 'Unknown Venue',
          city: 'Unknown',
          state: 'GA',
          country: 'USA'
        };
      }
    }
  }
  
  /**
   * Format a domain name as a venue name
   * @param domain The domain name
   * @returns Formatted venue name
   */
  private formatDomainAsName(domain: string): string {
    // Remove TLD
    const withoutTLD = domain.replace(/\.(com|org|net|io|gov)$/, '');
    
    // Split by dots and dashes
    const parts = withoutTLD.split(/[.-]/);
    
    if (parts.length > 1) {
      // Use the second-to-last part as the main domain name
      const mainPart = parts[parts.length - 2];
      
      // Format with capital letters and spaces
      return mainPart
        .split(/[_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    
    // If only one part, capitalize it
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  }
  
  /**
   * Infer a 2-letter state code from a state name or other text
   * @param stateText The state name or text to infer from
   * @returns 2-letter state code
   */
  private inferStateCode(stateText: string): string {
    const stateMap: Record<string, string> = {
      'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
      'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
      'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
      'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
      'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
      'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
      'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
      'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
      'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
      'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
      'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
      'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
      'wisconsin': 'WI', 'wyoming': 'WY'
    };
    
    // Check for exact match
    const normalizedText = stateText.toLowerCase().trim();
    if (stateMap[normalizedText]) {
      return stateMap[normalizedText];
    }
    
    // Check for partial match
    for (const [stateName, stateCode] of Object.entries(stateMap)) {
      if (normalizedText.includes(stateName)) {
        return stateCode;
      }
    }
    
    // Default to GA if no match
    return 'GA';
  }

  public async crawlConcertVenue(
    url: string,
    config: CrawlConfig
  ): Promise<ScrapedEvent[]> {
    console.log(`Starting crawl for ${url} with mode: ${config.mode}`);

    try {
      switch (config.mode) {
        case 'ai_prompt':
          if (!config.prompt) {
            throw new Error('AI prompt is required for ai_prompt mode.');
          }
          try {
            return await this.scrapeWithAIPrompt(url, config.prompt);
          } catch (aiError) {
            console.warn(`AI prompt scraping failed for ${url}. Attempting basic fallback scraping.`, aiError);
            return this.fallbackBasicScrape(url);
          }
        case 'selectors':
          if (!config.schema) {
            throw new Error('Selector schema is required for selectors mode.');
          }
          return this.scrapeWithSelectors(url, config.schema);
        default:
          throw new Error(`Unsupported crawl mode: ${config.mode}`);
      }
    } catch (error) {
      console.error(`Error in crawlConcertVenue for ${url}:`, error);
      // Return empty array instead of throwing to prevent cascade failures
      return [];
    }
  }

  private async scrapeWithAIPrompt(url: string, prompt: string): Promise<ScrapedEvent[]> {
    try {
      console.log(`AI Prompt scrape starting for: ${url}`);
      console.log(`Using prompt: "${prompt}"`);
      
      // Call the API directly to avoid TypeScript issues
      const response = await this.client.scrapeUrl(url, {
        formats: ['json'],
        jsonOptions: {
          schema: ExtractionSchema,
          prompt
        },
        waitFor: 5000
      });
      
      console.log('Response received:', 
        response ? `Contains JSON: ${'json' in response}` : 'No response'
      );

      if (response && 'json' in response) {
        // Log the raw JSON for debugging
        console.log('Raw JSON response available');
        
        // Parse and validate with Zod
        const parsed = ExtractionSchema.parse(response.json);
        console.log(`Successfully extracted ${parsed.events.length} events`);
        
        // Add the scrapedAt timestamp to each event
        return parsed.events.map(event => ({
          ...event,
          scrapedAt: new Date().toISOString(),
        }));
      } else {
        console.error('Firecrawl scrape failed or returned unexpected data format.');
        return [];
      }
    } catch (error) {
      console.error('Error during Firecrawl AI scrape:', error);
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async scrapeWithSelectors(url: string, schema: SelectorSchema): Promise<ScrapedEvent[]> {
    // This is a conceptual example of how selector-based extraction could work.
    // This might eventually use a library like Cheerio or a different Firecrawl feature.
    console.log('Selector mode is a placeholder for future implementation.');
    // For now, return an empty array or throw an error.
    return [];
  }

  private async fallbackBasicScrape(url: string): Promise<ScrapedEvent[]> {
    try {
      console.log(`Attempting fallback basic scrape for: ${url}`);
      const result = await this.scrapeUrl(url);
      
      if (!result.json?.events) {
        console.warn('No events found in fallback scrape');
        return [];
      }
      
      return result.json.events.map(event => ({
        ...event,
        scrapedAt: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Fallback scrape failed:', error);
      return [];
    }
  }
}