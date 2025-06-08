'use server'

import { FirecrawlService } from '@/services/firecrawl';
import { DataPersistenceService } from '@/services/data-persistence';
import { ScrapedData } from '@/types';

export async function getScrapeData(url: string): Promise<ScrapedData | { error: string }> {
  try {
    const firecrawlService = new FirecrawlService();
    const dataPersistenceService = new DataPersistenceService();

    const scrapedData = await firecrawlService.scrapeUrl(url);
    const filePath = await dataPersistenceService.save(scrapedData);

    console.log(`Data saved to ${filePath}`);
    return scrapedData;
  } catch (error) {
    console.error('Error scraping data in server action:', error);
    return { error: 'Failed to scrape data.' };
  }
} 