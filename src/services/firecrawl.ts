import Firecrawl from '@mendable/firecrawl-js';
import { z } from 'zod';
import { ScrapedData } from '../types';

const EventSchema = z.object({
  title: z.string(),
  date: z.string(),
  venue: z.string(),
  url: z.string().url(),
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
    this.client = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });
  }

  async scrapeUrl(url: string): Promise<ScrapedData> {
    try {
      const result = await this.client.scrapeUrl(url, {
        formats: ['json', 'markdown'],
        jsonOptions: {
          schema: ExtractionSchema,
        },
      });

      if (result && 'json' in result && result.json) {
        return {
          json: result.json,
          url: url,
          timestamp: new Date().toISOString(),
          metadata: result.metadata,
        };
      } else if (result && 'markdown' in result && result.markdown) {
        // Fallback to markdown if json extraction fails
        return {
          markdown: result.markdown,
          url: url,
          timestamp: new Date().toISOString(),
          metadata: result.metadata,
        };
      } else {
        throw new Error('Scraping did not return valid content.');
      }
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      throw new Error(`Failed to scrape ${url}`);
    }
  }
} 