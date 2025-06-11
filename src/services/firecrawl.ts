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