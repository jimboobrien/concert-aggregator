import { CrawlConfig, ScrapedEvent, SelectorSchema } from '@/types/scraping';
import FirecrawlApp from '@mendable/firecrawl-js';
import { z } from 'zod';

// Initialize the client once
const firecrawlClient = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! });

// Define the Zod schema for validation during extraction
const EventSchema = z.object({
  title: z.string(),
  date: z.string(),
  ticketUrl: z.string().optional(),
});

const ExtractionSchema = z.object({
  events: z.array(EventSchema),
});


export class FirecrawlService {
  public async crawlConcertVenue(
    url: string,
    config: CrawlConfig
  ): Promise<ScrapedEvent[]> {
    console.log(`Starting crawl for ${url} with mode: ${config.mode}`);

    switch (config.mode) {
      case 'ai_prompt':
        return this.scrapeWithAIPrompt(url, config.prompt);
      case 'selectors':
        return this.scrapeWithSelectors(url, config.schema);
      default:
        throw new Error(`Unsupported crawl mode: ${(config as any).mode}`);
    }
  }

  private async scrapeWithAIPrompt(url: string, prompt: string): Promise<ScrapedEvent[]> {
    try {
      const response = await firecrawlClient.scrapeUrl(url, {
        jsonOptions: {
          schema: ExtractionSchema,
          prompt: prompt,
        },
      });

      if (response && 'json' in response) {
        // The result is already validated by Zod during extraction
        const parsed = ExtractionSchema.parse(response.json);
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

  private async scrapeWithSelectors(url: string, schema: SelectorSchema): Promise<ScrapedEvent[]> {
    // This is a conceptual example of how selector-based extraction could work.
    // This might eventually use a library like Cheerio or a different Firecrawl feature.
    console.log('Selector mode is a placeholder for future implementation.');
    // For now, return an empty array or throw an error.
    return Promise.resolve([]);
  }
} 