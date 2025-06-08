# Phase 1: Flexible Scraping API with Firecrawl

## Overview

Phase 1 focuses on building a flexible and powerful scraping API centered around a unified `doCallForFirecrawl` abstraction. This approach allows for multiple data extraction methods—from AI-powered prompts to specific CSS selectors—all handled through a single, consistent interface. We will prioritize building this core service, its API endpoint, and reliable data persistence, setting a scalable foundation for future enhancements.

## Goals

- ✅ **Unified Scraping Service** with a flexible, multi-modal extraction engine.
- ✅ **Next.js API Route** for all scraping operations.
- ✅ **Support for Multiple Extraction Methods** (AI Prompt, CSS Selectors).
- ✅ **Dual Data Persistence** (JSON files + optional Supabase).
- ✅ **Configuration-driven** approach for defining scraping jobs.
- ✅ **Robust Validation** and error logging.

## Core Concept: The `doCallForFirecrawl` Abstraction

The entire scraping system is built around a single, powerful function signature. This design decouples the API endpoint from the underlying scraping technology, allowing us to evolve our methods without breaking the interface.

```typescript
// Core function signature
doCallForFirecrawl(
  url: string,
  config: CrawlConfig
): Promise<ScrapedData>;
```

- **`url`**: The target URL of the website to crawl.
- **`config`**: An object specifying *how* to extract the data. This configuration can be tailored for different needs.

## API Endpoint: A Single, Powerful Route

We will consolidate all scraping logic into a single API endpoint, making the system cleaner and easier to maintain.

```
app/api/scrape/route.ts    # POST /api/scrape
```

### API Usage Examples

The endpoint is designed to be highly flexible, accepting different types of `crawlConfig` objects.

#### Example 1: AI-Powered Extraction (Prompt-based)

This method is ideal for complex pages where selectors are unreliable.

```bash
POST /api/scrape
{
  "url": "https://www.thecaverns.com/events",
  "crawlConfig": {
    "mode": "ai_prompt",
    "prompt": "Extract all concert events. For each event, get the title, date, and a link to buy tickets. Return the data as a JSON array of objects, with keys 'title', 'date', and 'ticketUrl'."
  },
  "storageOptions": {
    "saveToFiles": true,
    "saveToSupabase": true,
    "fileName": "caverns-ai-scraped.json"
  }
}
```

#### Example 2: Selector-Based Extraction

This method is efficient for well-structured websites with stable HTML.

```bash
POST /api/scrape
{
  "url": "https://theorangepeel.net/events/",
  "crawlConfig": {
    "mode": "selectors",
    "schema": {
      "container": ".eventMainWrapper",
      "fields": {
        "title": "#eventTitle",
        "date": "#eventDate",
        "ticketUrl": ".eventTicketLink a[href]"
      }
    }
  },
  "storageOptions": {
    "saveToFiles": true,
    "fileName": "orangepeel-selector-scraped.json"
  }
}
```

## Core Scraping Service (`firecrawl-service.ts`)

This service acts as the central engine, interpreting the `CrawlConfig` and delegating to the appropriate Firecrawl method.

```typescript
// lib/scraping/firecrawl-service.ts
import Firecrawl from 'firecrawl';
import { CrawlConfig, ScrapedEvent } from '@/types/scraping';

// Initialize the client once
const firecrawlClient = new Firecrawl(process.env.FIRECRAWL_API_KEY!);

export class FirecrawlService {
  public async doCallForFirecrawl(
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
        throw new Error(`Unsupported crawl mode: ${config.mode}`);
    }
  }

  private async scrapeWithAIPrompt(url: string, prompt: string): Promise<ScrapedEvent[]> {
    // This is a conceptual example. The actual Firecrawl SDK call may differ.
    const result = await firecrawlClient.scrape(url, {
      extractor: {
        mode: 'llm-extraction',
        prompt: prompt,
        json_schema: {
          type: "object",
          properties: {
            events: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { "type": "string" },
                  date: { "type": "string" },
                  ticketUrl: { "type": "string" }
                },
                required: ["title", "date"]
              }
            }
          },
          required: ["events"]
        }
      }
    });
    
    // Assume result.data.llm_extraction.events is the array of events
    return result.data?.llm_extraction?.events || [];
  }

  private async scrapeWithSelectors(url: string, schema: any): Promise<ScrapedEvent[]> {
    // This is a conceptual example of how selector-based extraction could work.
    // This might eventually use a library like Cheerio or a different Firecrawl feature.
    console.log('Selector mode is a placeholder for future implementation.');
    // For now, return an empty array or throw an error.
    return [];
  }
}
```

## Extraction Configuration (`types/scraping.d.ts`)

We define clear types for our configuration objects to ensure type safety and clarity.

```typescript
// types/scraping.d.ts

export interface ScrapedEvent {
  title: string;
  date: string;
  ticketUrl?: string;
  venue?: string;
  scrapedAt: string;
}

// Configuration for selector-based extraction
export interface SelectorSchema {
  container: string;
  fields: {
    title: string;
    date: string;
    ticketUrl?: string;
  };
}

// Union type for all possible crawl configurations
export type CrawlConfig =
  | { mode: 'ai_prompt'; prompt: string }
  | { mode: 'selectors'; schema: SelectorSchema };

// Options for how to store the scraped data
export interface StorageOptions {
  saveToFiles: boolean;
  saveToSupabase?: boolean;
  fileName: string; // Used for JSON file output
  outputDir?: string;
  venueId?: string; // Used for Supabase foreign key
}
```

## API Route Implementation (`scrape/route.ts`)

The API route ties everything together: it parses the request, calls the `FirecrawlService`, and persists the data using the `DataPersistenceService`.

```typescript
// app/api/scrape/route.ts
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
    const events = await scraper.doCallForFirecrawl(url, crawlConfig);
    console.log(`Successfully scraped ${events.length} events from ${url}`);

    // 2. Add metadata
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

  } catch (error) {
    console.error('Scraping API Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unknown error occurred',
    }, { status: 500 });
  }
}
```

## Testing & Validation

Update your `package.json` and use `curl` to test the new flexible endpoint.

```bash
# Test with AI Prompt
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.thecaverns.com/events",
    "crawlConfig": { "mode": "ai_prompt", "prompt": "Extract all concert events, getting the title and date." },
    "storageOptions": { "saveToFiles": true, "fileName": "caverns.json", "venueId": "caverns" }
  }'

# Test with Selectors (Placeholder for now)
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://theorangepeel.net/events/",
    "crawlConfig": {
      "mode": "selectors",
      "schema": { "container": ".eventMainWrapper", "fields": { "title": "#eventTitle" } }
    },
    "storageOptions": { "saveToFiles": true, "fileName": "orangepeel.json", "venueId": "orangepeel" }
  }'
```

## Success Criteria for Phase 1

- ✅ A single `/api/scrape` endpoint handles all scraping requests.
- ✅ The service can accept an AI prompt for data extraction.
- ✅ The service is structured to accept a selector-based config in the future.
- ✅ Scraped data is successfully saved to a JSON file.
- ✅ (Optional) Scraped data is successfully saved to Supabase.
- ✅ The system is decoupled from a specific scraping library (like Puppeteer).

## Next Steps

With this flexible foundation, future work can focus on:
1.  **Implementing Selector-Based Scraping**: Build out the `scrapeWithSelectors` method using a library like Cheerio or a specific Firecrawl feature.
2.  **Building a UI**: Create a simple admin dashboard to trigger and monitor scraping jobs.
3.  **Adding More Extractors**: Introduce other modes, such as `hybrid` (AI + selectors), as needed.
4.  **Error Handling & Retries**: Implement more sophisticated error handling and automatic retry logic for failed jobs. 