import Firecrawl from '@mendable/firecrawl-js';
import { ScrapedData } from '../types';

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
      const result = await this.client.scrapeUrl(url);

      if (result && 'markdown' in result && result.markdown) {
        return {
          markdown: result.markdown,
          url: url,
          timestamp: new Date().toISOString(),
          metadata: {
            title: result.metadata?.title,
            description: result.metadata?.description,
            keywords: result.metadata?.keywords,
          },
        };
      } else {
        throw new Error('Scraping did not return markdown content.');
      }
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      throw new Error(`Failed to scrape ${url}`);
    }
  }
} 