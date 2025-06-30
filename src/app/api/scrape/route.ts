import { NextRequest, NextResponse } from 'next/server';
import { FirecrawlService } from '@/services/firecrawl';
import { DataPersistenceService } from '@/services/data-persistence';
import { CrawlConfig as ApiCrawlConfig, StorageOptions } from '@/types/scraping';
import { CrawlConfig as ServiceCrawlConfig, SelectorSchema as ServiceSelectorSchema } from '@/types';
import { formatScrapedData } from '@/utils/format-scraped-data';
import { findOrCreateVenue } from '@/utils/venue-utils';

// Adapter function to convert API CrawlConfig to service CrawlConfig
function adaptCrawlConfig(apiConfig: ApiCrawlConfig): ServiceCrawlConfig {
  if (apiConfig.mode === 'ai_prompt') {
    return {
      mode: 'ai_prompt',
      prompt: apiConfig.prompt
    };
  } else {
    // For selector mode, we need to convert the schema to the service format
    // Our service implementation doesn't actually use the schema yet (returns empty array)
    // But we need to make TypeScript happy with a properly typed object
    const serviceSchema: ServiceSelectorSchema = {};
    
    // Copy fields from apiConfig.schema to serviceSchema
    if (apiConfig.schema) {
      const { container, fields } = apiConfig.schema;
      serviceSchema['container'] = container;
      
      // Copy each field
      if (fields) {
        Object.entries(fields).forEach(([key, value]) => {
          serviceSchema[key] = value;
        });
      }
    }
    
    return {
      mode: 'selectors',
      schema: serviceSchema
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      url,
      crawlConfig,
      storageOptions,
    }: {
      url: string;
      crawlConfig: ApiCrawlConfig;
      storageOptions: StorageOptions & { detectVenue?: boolean };
    } = body;

    if (!url || !crawlConfig || !storageOptions) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: url, crawlConfig, or storageOptions',
      }, { status: 400 });
    }

    const scraper = new FirecrawlService();
    const storage = new DataPersistenceService();

    // 1. Get or create venue with location information
    let venueId = storageOptions.venueId;
    let venueName;
    let venueCity;
    let venueState;

    if (storageOptions.detectVenue || !venueId) {
      try {
        console.log('Finding or creating venue from URL:', url);
        const venueResult = await findOrCreateVenue(url);
        venueId = venueResult.id;
        venueName = venueResult.name;
        venueCity = venueResult.city;
        venueState = venueResult.state;
        console.log(`Venue detected: ${venueName} (${venueCity}, ${venueState})`);
      } catch (venueError) {
        console.error('Error finding/creating venue:', venueError);
        // Continue with scraping even if venue detection fails
      }
    }

    // 2. Perform scraping with adapted config
    const adaptedConfig = adaptCrawlConfig(crawlConfig);
    const events = await scraper.crawlConcertVenue(url, adaptedConfig);
    console.log(`Successfully scraped ${events.length} events from ${url}`);

    // Format the data consistently using our utility
    const formattedData = formatScrapedData(url, events, venueName);

    // 3. Save data using the new formatted structure
    // First we need to adapt the storage options to match what our DataPersistenceService expects
    const adaptedOptions = {
      saveToJson: !!storageOptions.saveToFiles,
      saveToSupabase: !!storageOptions.saveToSupabase
    };
    
    const filePath = await storage.saveScrapedEvents(
      url,
      events,
      adaptedOptions,
      venueId,
      venueName
    );

    return NextResponse.json({
      success: true,
      url,
      count: events.length,
      venue: {
        id: venueId,
        name: venueName,
        city: venueCity,
        state: venueState
      },
      saved: {
        jsonFile: filePath !== 'No file saved.' ? filePath : null,
        database: !!storageOptions.saveToSupabase
      },
      data: formattedData.json?.events || [],
    });

  } catch (error: unknown) {
    console.error('Scraping API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
} 