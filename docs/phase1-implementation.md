# Phase 1: Core Scraping API Implementation

## Overview

Phase 1 focuses on creating a solid foundation with enhanced Puppeteer scraping, Next.js API endpoints, and reliable data persistence. This phase gets the basic functionality working correctly before adding AI features.

## Goals

- ✅ **Enhanced Puppeteer scraping** with improved error handling
- ✅ **Next.js API Routes** for scraping control
- ✅ **Dual data persistence** (JSON files + optional Supabase)
- ✅ **Venue configuration system** with flexible selectors
- ✅ **Basic validation** and error logging
- ✅ **Status tracking** and monitoring

## API Endpoints

### Core Endpoints (Phase 1)
```
app/api/scrape/
├── venue/[venueId]/route.ts    # POST /api/scrape/venue/[venueId]
├── all/route.ts                # POST /api/scrape/all  
└── status/route.ts             # GET /api/scrape/status
```

### API Usage Examples

#### Scrape Single Venue
```bash
POST /api/scrape/venue/orangepeel
{
  "force": false,
  "saveToFiles": true,
  "saveToSupabase": false
}

# Response
{
  "success": true,
  "venue": "The Orange Peel",
  "events": [...],
  "count": 25,
  "saved": {
    "jsonFile": "output/orangepeel.json",
    "database": false
  },
  "scrapedAt": "2024-03-01T10:00:00Z"
}
```

#### Scrape All Venues
```bash
POST /api/scrape/all
{
  "venues": ["orangepeel", "caverns", "terminalwest", "district"],
  "saveToFiles": true,
  "saveToSupabase": false
}

# Response
{
  "success": true,
  "results": {
    "orangepeel": { "success": true, "count": 25 },
    "caverns": { "success": true, "count": 18 },
    "terminalwest": { "success": false, "error": "Connection timeout" },
    "district": { "success": true, "count": 12 }
  },
  "totalEvents": 55,
  "scrapedAt": "2024-03-01T10:00:00Z"
}
```

#### Get Scraping Status
```bash
GET /api/scrape/status

# Response
{
  "venues": {
    "orangepeel": {
      "lastScraped": "2024-03-01T10:00:00Z",
      "status": "success",
      "eventCount": 25,
      "nextScheduled": "2024-03-01T16:00:00Z"
    },
    "caverns": {
      "lastScraped": "2024-03-01T10:15:00Z",
      "status": "failed", 
      "error": "Selector not found: .eventMainWrapper",
      "lastSuccess": "2024-02-28T10:15:00Z"
    }
  },
  "systemStatus": "operational"
}
```

## Enhanced Puppeteer Service

### Core Service Implementation
```typescript
// lib/scraping/enhanced-puppeteer.ts
import puppeteer, { Browser, Page } from 'puppeteer';
import { VenueConfig, ScrapedEvent } from '@/types/scraping';

export class EnhancedPuppeteerService {
  private browser: Browser | null = null;

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  async scrapeVenue(venueConfig: VenueConfig): Promise<ScrapedEvent[]> {
    const browser = await this.initBrowser();
    const page = await browser.newPage();
    
    try {
      await page.setUserAgent('Mozilla/5.0 (compatible; ConcertBot/1.0)');
      
      // Navigate with timeout and error handling
      await page.goto(venueConfig.url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait for content to load
      if (venueConfig.waitForSelector) {
        await page.waitForSelector(venueConfig.waitForSelector, { 
          timeout: 15000 
        });
      }

      // Extract events with improved error handling
      const events = await page.evaluate((config) => {
        return this.extractEvents(config);
      }, venueConfig);

      return this.validateAndNormalize(events, venueConfig.name);
      
    } catch (error) {
      console.error(`Scraping failed for ${venueConfig.name}:`, error);
      throw error;
    } finally {
      await page.close();
    }
  }

  private extractEvents(config: VenueConfig): any[] {
    const events = [];
    const containers = document.querySelectorAll(config.selectors.container);
    
    containers.forEach((container, index) => {
      try {
        const event = this.extractSingleEvent(container, config.selectors);
        if (event && event.title && event.date) {
          events.push(event);
        }
      } catch (error) {
        console.warn(`Error extracting event ${index}:`, error);
      }
    });
    
    return events;
  }

  private extractSingleEvent(element: Element, selectors: any): any {
    return {
      title: this.getTextContent(element, selectors.title),
      date: this.getTextContent(element, selectors.date),
      time: this.getTextContent(element, selectors.time) || 'TBA',
      price: this.getTextContent(element, selectors.price) || 'TBA',
      ticketUrl: this.getAttributeContent(element, selectors.ticketLink, 'href'),
      description: this.getTextContent(element, selectors.description)
    };
  }

  private getTextContent(element: Element, selector: string): string {
    const found = element.querySelector(selector);
    return found?.textContent?.trim() || '';
  }

  private getAttributeContent(element: Element, selector: string, attr: string): string {
    const found = element.querySelector(selector);
    return found?.getAttribute(attr) || '';
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
```

## Venue Configuration System

### Configuration Structure
```typescript
// lib/config/venues.ts
export interface VenueConfig {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  selectors: {
    container: string;
    title: string;
    date: string;
    time?: string;
    price?: string;
    ticketLink?: string;
    description?: string;
  };
  waitForSelector?: string;
  schedule?: string; // cron expression
}

export const venueConfigs: Record<string, VenueConfig> = {
  orangepeel: {
    id: 'orangepeel',
    name: 'The Orange Peel',
    url: 'https://theorangepeel.net/events/',
    enabled: true,
    selectors: {
      container: '.eventMainWrapper',
      title: '#eventTitle',
      date: '#eventDate',
      time: '.eventDateDetails',
      price: '.eventPrice',
      ticketLink: '.eventTicketLink a'
    },
    waitForSelector: '.eventMainWrapper',
    schedule: '0 */6 * * *' // Every 6 hours
  },
  
  caverns: {
    id: 'caverns',
    name: 'The Caverns',
    url: 'https://www.thecaverns.com/events',
    enabled: true,
    selectors: {
      container: '.event-item',
      title: '.event-title',
      date: '.event-date',
      time: '.event-time',
      price: '.ticket-price'
    },
    waitForSelector: '.event-item'
  }
  // ... other venues
};

export function getVenueConfig(venueId: string): VenueConfig | null {
  return venueConfigs[venueId] || null;
}

export function getAllActiveVenues(): VenueConfig[] {
  return Object.values(venueConfigs).filter(config => config.enabled);
}
```

## Data Persistence Layer

### Dual Storage System
```typescript
// lib/storage/data-persistence.ts
import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

export interface StorageOptions {
  saveToFiles: boolean;
  saveToSupabase: boolean;
  outputDir?: string;
}

export class DataPersistenceService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  async saveVenueData(
    venueId: string, 
    events: ScrapedEvent[], 
    options: StorageOptions
  ) {
    const results = {
      jsonFile: null as string | null,
      database: false,
      errors: [] as string[]
    };

    // Save to JSON files
    if (options.saveToFiles) {
      try {
        const outputDir = options.outputDir || 'output';
        await fs.mkdir(outputDir, { recursive: true });
        
        const filePath = path.join(outputDir, `${venueId}.json`);
        await fs.writeFile(filePath, JSON.stringify(events, null, 2));
        
        results.jsonFile = filePath;
        console.log(`Saved ${events.length} events to ${filePath}`);
      } catch (error) {
        results.errors.push(`JSON save failed: ${error.message}`);
      }
    }

    // Save to Supabase (optional)
    if (options.saveToSupabase) {
      try {
        const { error } = await this.supabase
          .from('events')
          .upsert(
            events.map(event => ({
              ...event,
              venue_id: venueId,
              scraped_at: new Date().toISOString()
            })),
            { onConflict: 'title,date,venue_id' }
          );

        if (error) throw error;
        results.database = true;
        console.log(`Saved ${events.length} events to Supabase`);
      } catch (error) {
        results.errors.push(`Supabase save failed: ${error.message}`);
      }
    }

    return results;
  }

  async getStoredEvents(venueId: string, source: 'file' | 'database' = 'file') {
    if (source === 'file') {
      try {
        const filePath = path.join('output', `${venueId}.json`);
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
      } catch (error) {
        return [];
      }
    } else {
      const { data, error } = await this.supabase
        .from('events')
        .select('*')
        .eq('venue_id', venueId)
        .order('date', { ascending: true });

      return error ? [] : data;
    }
  }
}
```

## Testing & Validation

### Basic Testing
```bash
# Start development server
npm run dev

# Test single venue scraping
curl -X POST http://localhost:3000/api/scrape/venue/orangepeel \
  -H "Content-Type: application/json" \
  -d '{"force": true, "saveToFiles": true}'

# Test all venues
curl -X POST http://localhost:3000/api/scrape/all \
  -H "Content-Type: application/json" \
  -d '{"saveToFiles": true, "saveToSupabase": false}'

# Check status
curl http://localhost:3000/api/scrape/status
```

### Success Criteria for Phase 1
- ✅ All venue scrapers work via API endpoints
- ✅ Data saves to JSON files reliably
- ✅ Error handling and logging functional
- ✅ Status endpoint provides useful information
- ✅ Venue configurations are flexible and maintainable
- ✅ Optional Supabase integration works when enabled

## Next Steps to Phase 2

Once Phase 1 is complete and stable:
1. Add Firecrawl.dev integration as primary scraping method
2. Implement hybrid fallback system (Firecrawl → Puppeteer)
3. Add custom venue endpoint with configurable extraction rules
4. Enhanced data processing and quality metrics 