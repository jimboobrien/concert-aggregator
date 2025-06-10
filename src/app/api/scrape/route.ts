import { NextRequest, NextResponse } from 'next/server';
import { FirecrawlService } from '@/services/firecrawl';
import { DataPersistenceService } from '@/services/data-persistence';
import { CrawlConfig as ApiCrawlConfig, StorageOptions } from '@/types/scraping';
import { CrawlConfig as ServiceCrawlConfig, SelectorSchema as ServiceSelectorSchema } from '@/types';
import { formatScrapedData } from '@/utils/format-scraped-data';

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

    // 1. Perform scraping with adapted config
    const adaptedConfig = adaptCrawlConfig(crawlConfig);
    const events = await scraper.crawlConcertVenue(url, adaptedConfig);
    console.log(`Successfully scraped ${events.length} events from ${url}`);

    // Get venue name from venue ID if available
    let venueName;
    if (storageOptions.venueId) {
      // This would ideally fetch the venue name from the database
      // For now, we'll use the hostname as a fallback
      venueName = storageOptions.venueId;
    }

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
      storageOptions.venueId,
      venueName
    );

    return NextResponse.json({
      success: true,
      url,
      count: events.length,
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