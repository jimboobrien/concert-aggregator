import Firecrawl from '@mendable/firecrawl-js';
import { z } from 'zod';
import { ScrapedData, CrawlConfig, ScrapedEvent, SelectorSchema, ConcertEvent } from '../types';

const EventSchema = z.object({
  title: z.string(),
  date: z.string(),
  ticketUrl: z.string().optional(),
});

const ExtractionSchema = z.object({
  events: z.array(EventSchema),
});

export class FirecrawlService {
  private client: Firecrawl;

  constructor() {
    if (!process.env.FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY is not set');
    }
    // Initialize client with the API key
    this.client = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });
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
    const maxRetries = 3;
    let attempts = 0;
    
    // Determine if this is a known problematic site that needs special handling
    const isProblematicSite = /thecaverns\.com|otherProblemSite\.com/i.test(url);
    
    // Set appropriate timeout based on the site
    const baseTimeout = isProblematicSite ? 120000 : 60000; // 2 minutes for problematic sites, 1 minute for others
    
    while (attempts <= maxRetries) {
      try {
        console.log(`AI Prompt scrape starting for: ${url}`);
        console.log(`Using prompt: "${prompt}"`);
        
        // Use more robust options for concert scraping
        const response = await this.client.scrapeUrl(url, {
          formats: ['markdown', 'json'],
          waitFor: isProblematicSite ? 10000 : 5000, // Longer wait for problematic sites
          onlyMainContent: true, // Filter out navigation, etc.
          jsonOptions: {
            schema: ExtractionSchema,
            prompt: prompt,
          },
          timeout: baseTimeout * (attempts + 1), // Increase timeout with each retry
          mobile: isProblematicSite, // Try mobile view for problematic sites
        });

        console.log(`Raw response type: ${typeof response}`);
        console.log(`Response has error: ${'error' in response}`);
        console.log(`Response has json: ${'json' in response}`);
        
        // Check if the response indicates an error
        if ('error' in response) {
          const errorMessage = typeof response.error === 'string' 
            ? response.error 
            : JSON.stringify(response.error || 'Unknown error');
          throw new Error(`Firecrawl API error: ${errorMessage}`);
        }

        if (!response || !('json' in response)) {
          throw new Error('Invalid response format from Firecrawl');
        }
        
        if (!response.json?.events || !Array.isArray(response.json.events) || response.json.events.length === 0) {
          console.warn('No events found in Firecrawl response');
          return [];
        }
        
        // Extract events and validate with Zod schema
        const extractedEvents = response.json.events;
        console.log(`Found ${extractedEvents.length} events in the response`);
        
        // Validate the response with Zod schema
        const validEvents: ScrapedEvent[] = [];
        
        for (const event of extractedEvents) {
          try {
            const validEvent = EventSchema.parse(event);
            validEvents.push({
              ...validEvent,
              scrapedAt: new Date().toISOString()
            });
          } catch (error) {
            console.warn('Event validation failed:', error);
          }
        }
        
        console.log(`Validated ${validEvents.length} of ${extractedEvents.length} events`);
        return validEvents;
        
      } catch (error) {
        attempts++;
        console.error(`Error during Firecrawl AI scrape (attempt ${attempts}/${maxRetries + 1}):`, error);
        
        if (attempts <= maxRetries) {
          // Add exponential backoff between retries with longer delays for problematic sites
          const backoffTime = Math.pow(2, attempts) * (isProblematicSite ? 2000 : 1000);
          console.log(`Retrying in ${backoffTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        } else {
          // If all retries failed, throw the error
          throw error;
        }
      }
    }
    
    // This shouldn't be reached due to the throw in the catch block,
    // but TypeScript needs it for type checking
    return [];
  }

  private async scrapeWithSelectors(url: string, schema: SelectorSchema): Promise<ScrapedEvent[]> {
    console.log('Selector mode is a placeholder for future implementation.', url, schema);
    return Promise.resolve([]);
  }

  // Fallback method for basic scraping when AI prompt scraping fails
  private async fallbackBasicScrape(url: string): Promise<ScrapedEvent[]> {
    try {
      console.log(`Attempting fallback basic scrape for: ${url}`);
      
      // Use a much simpler approach - just get the raw HTML content
      const response = await this.client.scrapeUrl(url, {
        formats: ['rawHtml'],
        waitFor: 3000,
        timeout: 30000,
      });
      
      if ('error' in response || !response.rawHtml) {
        console.error('Fallback scrape also failed');
        return [];
      }
      
      console.log('Successfully fetched raw HTML in fallback mode');
      
      // For now, just return an empty array
      // In a future implementation, we could add basic HTML parsing here
      // to extract events from the raw HTML using common patterns
      return [];
    } catch (error) {
      console.error('Fallback scraping failed:', error);
      return [];
    }
  }
} 