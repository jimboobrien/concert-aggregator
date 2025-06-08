import { NextRequest, NextResponse } from 'next/server';
import { FirecrawlService } from '@/lib/scraping/firecrawl-service';
import { DataPersistenceService } from '@/lib/storage/data-persistence';
import { CrawlConfig, StorageOptions } from '@/types/scraping';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      url,
      crawlConfig,
      storageOptions,
    }: {
      url: string;
      crawlConfig: CrawlConfig;
      storageOptions: StorageOptions;
    } = body;

    if (!url || !crawlConfig || !storageOptions) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: url, crawlConfig, or storageOptions',
      }, { status: 400 });
    }

    const scraper = new FirecrawlService();
    const storage = new DataPersistenceService();

    // 1. Perform scraping
    const events = await scraper.crawlConcertVenue(url, crawlConfig);
    console.log(`Successfully scraped ${events.length} events from ${url}`);

    // 2. Add metadata (venueId is already in storageOptions)
    const enrichedEvents = events.map(event => ({
      ...event,
      venue: storageOptions.venueId || new URL(url).hostname,
      scrapedAt: new Date().toISOString(),
    }));

    // 3. Save data
    const saveResults = await storage.saveVenueData(
      storageOptions,
      enrichedEvents
    );

    return NextResponse.json({
      success: true,
      url,
      count: enrichedEvents.length,
      saved: saveResults,
      data: enrichedEvents,
    });

  } catch (error: any) {
    console.error('Scraping API Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unknown error occurred',
    }, { status: 500 });
  }
} 