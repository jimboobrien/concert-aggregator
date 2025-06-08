# Scraping System Modernization

## Overview

Transform the Concert Aggregator's scraping approach from manual Puppeteer scripts to a modern, scalable scraping system with multiple data collection methods including firecrawl.dev integration.

## Current vs Future Scraping Architecture

### Current Architecture (v1.0)
- Manual Node.js scripts (orangepeel.js, thecaverns.js, etc.)
- Direct Puppeteer browser automation
- **File-based JSON output** (static data)
- Manual execution via npm scripts
- No real-time updates or user interaction

### Future Architecture (v2.0+)
- **Next.js 14+ with App Router** for full-stack application
- **Supabase** for authentication, database, and real-time features
- **Next.js API Routes** for scraping control endpoints
- **Flexible custom venue endpoint** - scrape any venue with configurable rules
- **Firecrawl.dev** as primary AI-powered scraping service
- **Enhanced Puppeteer** as fallback method
- **Real-time data flow**: Scraped data → Supabase → Live UI updates
- **Field mapping and validation pipeline** with custom transformations
- **Configuration presets** for reusable extraction patterns
- **Row Level Security (RLS)** for data access control
- **Server Components** for optimized data fetching
- **CRUD dashboards** for data management and analytics
- **Template architecture** for reusable CRUD applications

## Firecrawl.dev Integration

### What is Firecrawl?
Firecrawl is a modern web scraping API that provides:
- **AI-powered extraction** with natural language queries
- **Built-in rate limiting** and anti-detection measures
- **Structured data output** in JSON format
- **JavaScript rendering** for dynamic content
- **Concurrent scraping** with automatic retries

### Benefits over Traditional Puppeteer
- **Reduced Infrastructure**: No need to manage browser instances
- **Better Reliability**: Built-in error handling and retries
- **Faster Development**: AI extraction vs manual CSS selectors
- **Scalability**: Cloud-based processing
- **Compliance**: Built-in respect for robots.txt and rate limits

## Supabase Data Integration

### Real-time Data Flow
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Data Sources  │───▶│   API Routes    │───▶│   Supabase DB   │
│   (Venues)      │    │   (Scraping)    │    │   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin Dashboard│◀───│  Real-time Sync │◀───│  Data Changes   │
│   (Management)  │    │   (Supabase)    │    │   (Triggers)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐                              ┌─────────────────┐
│   User Dashboard│◀─────────────────────────────│  Live Updates   │
│   (Saved Events)│                              │  (All Clients)  │
└─────────────────┘                              └─────────────────┘
```

### Database Operations
```typescript
// Custom venue scraping with Supabase integration
export async function POST(request: NextRequest) {
  try {
    const scrapingResult = await hybridScrapingService.scrapeCustomVenue(config);
    
    // Insert/update events in Supabase with conflict resolution
    const { data: events, error } = await supabase
      .from('events')
      .upsert(
        scrapingResult.events.map(event => ({
          ...event,
          venue_id: venueId,
          scraped_at: new Date().toISOString()
        })),
        { 
          onConflict: 'title,date,venue_id',
          ignoreDuplicates: false 
        }
      );

    if (error) throw error;

    // Log scraping activity
    await supabase.from('scraping_logs').insert({
      venue_id: venueId,
      status: 'success',
      events_found: scrapingResult.events.length,
      events_created: events?.length || 0,
      method: scrapingResult.method,
      execution_time: scrapingResult.duration
    });

    // Real-time broadcast happens automatically via Supabase
    return NextResponse.json({
      success: true,
      events: events,
      realtime: 'enabled' // UI updates automatically
    });

  } catch (error) {
    // Error logging and handling
  }
}
```

### Real-time UI Updates
```typescript
// Client-side real-time event subscription
'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function EventsList() {
  const [events, setEvents] = useState([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Subscribe to real-time events
    const channel = supabase
      .channel('events_changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'events',
          filter: 'is_public=eq.true'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setEvents(current => [payload.new, ...current]);
          } else if (payload.eventType === 'UPDATE') {
            setEvents(current => 
              current.map(event => 
                event.id === payload.new.id ? payload.new : event
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setEvents(current => 
              current.filter(event => event.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <div>
      {events.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
```

### CRUD Dashboard Integration
```typescript
// Admin dashboard with full CRUD capabilities
export default function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [scrapingLogs, setScrapingLogs] = useState([]);

  // Real-time data subscriptions for admin
  useEffect(() => {
    const eventsChannel = supabase
      .channel('admin_events')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'events' },
        handleEventUpdate
      )
      .subscribe();

    const logsChannel = supabase
      .channel('scraping_logs')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'scraping_logs' },
        handleLogUpdate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(logsChannel);
    };
  }, []);

  return (
    <div className="admin-dashboard">
      <ScrapingControls venues={venues} />
      <EventsManagement events={events} />
      <ScrapingLogs logs={scrapingLogs} />
      <Analytics />
    </div>
  );
}
```

### Template Benefits for CRUD Applications

#### Data Management
- **Automatic conflict resolution** for duplicate detection
- **Audit trail** with scraping logs and change history
- **Bulk operations** for batch updates and corrections
- **Data validation** at database level with constraints

#### User Experience
- **Live updates** without page refreshes
- **Collaborative editing** with real-time synchronization
- **Optimistic updates** for instant feedback
- **Offline support** with automatic sync when reconnected

#### Developer Experience
- **Type-safe APIs** generated from database schema
- **Real-time subscriptions** with simple client setup
- **Built-in authentication** and authorization
- **Automatic API generation** for all CRUD operations

## Implementation Plan

### Phase 1: Core Scraping API with Data Persistence
**Focus**: Get basic scraping working with proper API endpoints and data storage

**Essential Features:**
- **Enhanced Puppeteer scraping** with improved error handling
- **Next.js API Routes** for scraping control
- **Data persistence** (JSON files + optional Supabase integration)
- **Basic validation** and error logging

**API Endpoints (Phase 1):**
```
app/api/scrape/
├── venue/[venueId]/route.ts    # POST /api/scrape/venue/[venueId]
├── all/route.ts                # POST /api/scrape/all
└── status/route.ts             # GET /api/scrape/status
```

**Core Implementation:**
1. **Enhanced Puppeteer service** with better selectors and error handling
2. **Venue configuration system** with flexible selector mapping
3. **Data validation** and normalization pipeline
4. **Dual storage**: Save to JSON files AND optionally to Supabase
5. **Basic logging** and status tracking

## Firecrawl Service Implementation

The core of the Firecrawl integration is encapsulated within the `FirecrawlService` class, located at `src/services/firecrawl.ts`. This service provides a dedicated, reusable interface for interacting with the Firecrawl API.

### `FirecrawlService` Class

This class is designed as a singleton provider for all Firecrawl-related operations.

- **Constructor**: Initializes the Firecrawl client using the `FIRECRAWL_API_KEY` from the environment variables. It will throw an error if the key is not set, preventing the application from running with a misconfigured service.
- **`scrapeUrl(url: string)`**: An asynchronous method that takes a URL, sends it to the Firecrawl API, and returns a promise that resolves to a `ScrapedData` object.

### The `scrapeUrl` Method

This is the primary method for scraping a single URL. Its logic is as follows:

1.  **API Call**: It calls `this.client.scrapeUrl(url)` to perform the scrape.
2.  **Type Guard**: It uses a type guard (`'markdown' in result`) to check if the response is a successful scrape result or an error. This is a robust way to handle the union type returned by the SDK.
3.  **Data Transformation**: If successful, it transforms the raw response from Firecrawl into the application-defined `ScrapedData` format, which includes the markdown content, the original URL, a timestamp, and key metadata.
4.  **Error Handling**: If the scrape fails, or if the response does not contain markdown, it throws an error. This ensures that downstream consumers of the service receive a consistent and predictable data structure.

### Code Example

Here is the complete implementation of the service:

```typescript
// src/services/firecrawl.ts
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
```

### Phase 2: AI-Powered Scraping with Firecrawl
**Focus**: Add Firecrawl.dev integration as primary scraping method

**Enhanced Features:**
- **Firecrawl integration** with AI-powered extraction
- **Hybrid fallback system** (Firecrawl → Puppeteer)
- **Custom venue endpoint** with configurable extraction rules
- **Advanced data processing** and quality metrics

**Additional API Endpoints:**
```
app/api/scrape/
├── custom/route.ts             # POST /api/scrape/custom
├── presets/route.ts            # GET/POST /api/scrape/presets
└── presets/[name]/route.ts     # GET /api/scrape/presets/[name]
```

## Venue-Specific Configuration

### Firecrawl Extraction Prompts
Each venue will have custom AI prompts:

**The Orange Peel:**
```
Extract upcoming concert events from this venue page. 
For each event, find:
- Event/artist title
- Date (convert to YYYY-MM-DD format)
- Time (if available)
- Ticket price or price range
- Brief description
- Ticket purchase link

Only include future events, ignore past events.
```

**The Caverns:**
```
Extract concert and event listings from The Caverns venue page.
For each event, extract:
- Artist or event name
- Performance date
- Show time
- Ticket pricing information
- Event description or details
- Link to buy tickets

Focus on music events and concerts.
```

## API Design

### Next.js API Route Implementation

#### Custom Venue Scraping Route
**File: `app/api/scrape/custom/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { hybridScrapingService } from '@/lib/scraping/hybrid-service';
import { validateScrapingConfig } from '@/lib/validation/scraping-validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, venueName, extractionConfig, fieldMapping, filters } = body;

    // Validate the extraction configuration
    const validation = validateScrapingConfig(body);
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid configuration',
        validationErrors: validation.errors
      }, { status: 400 });
    }

    // Perform the scraping
    const result = await hybridScrapingService.scrapeCustomVenue({
      url,
      venueName,
      extractionConfig,
      fieldMapping,
      filters
    });

    return NextResponse.json({
      success: true,
      url,
      venueName,
      events: result.events,
      count: result.events.length,
      method: result.method,
      scrapedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Custom scraping failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
```

#### Venue-Specific Scraping Route
**File: `app/api/scrape/venue/[venueId]/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { hybridScrapingService } from '@/lib/scraping/hybrid-service';
import { getVenueConfig } from '@/lib/config/venues';

interface RouteContext {
  params: { venueId: string }
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { venueId } = params;
    const body = await request.json();
    const { force = false, method = 'auto' } = body;

    // Get venue configuration
    const venueConfig = getVenueConfig(venueId);
    if (!venueConfig) {
      return NextResponse.json({
        success: false,
        error: `Unknown venue: ${venueId}`
      }, { status: 404 });
    }

    // Check for cached data unless forced
    if (!force) {
      const cached = await getCachedVenueData(venueId, 6); // 6 hours
      if (cached) {
        return NextResponse.json({
          success: true,
          cached: true,
          events: cached.events,
          count: cached.events.length,
          lastScraped: cached.scrapedAt
        });
      }
    }

    // Scrape the venue
    const result = await hybridScrapingService.scrapeVenue(venueId, method);
    
    // Cache the results
    await cacheVenueData(venueId, result);

    return NextResponse.json({
      success: true,
      cached: false,
      events: result.events,
      count: result.events.length,
      method: result.method,
      scrapedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Scraping failed for venue ${params.venueId}:`, error);
    return NextResponse.json({
      success: false,
      error: error.message,
      venueId: params.venueId
    }, { status: 500 });
  }
}
```

### API Usage Examples
```javascript
// Scrape individual venue
POST /api/scrape/venue/orangepeel
{
  "force": false,  // Skip cache if true
  "method": "auto" // "firecrawl", "puppeteer", or "auto"
}

// Response
{
  "success": true,
  "cached": false,
  "events": [...],
  "count": 25,
  "scrapedAt": "2024-03-01T10:00:00Z",
  "method": "firecrawl"
}
```

### Custom Venue Scraping
```javascript
// Flexible endpoint for any venue with custom extraction rules
POST /api/scrape/custom
{
  "url": "https://venue-website.com/events",
  "venueName": "Custom Venue Name",
  "extractionConfig": {
    "method": "auto", // "firecrawl", "puppeteer", or "auto"
    "firecrawl": {
      "extractionPrompt": "Extract concert events with title, date, time, price, and ticket link",
      "waitTime": 3000
    },
    "puppeteer": {
      "selectors": {
        "container": ".event-item",
        "title": ".event-title, h3",
        "date": ".event-date, .date",
        "time": ".event-time, .time", 
        "price": ".price, .cost, .ticket-price",
        "ticketLink": "a[href*='ticket'], .buy-tickets",
        "description": ".description, .event-details"
      },
      "waitForSelector": ".event-item",
      "waitTime": 2000
    }
  },
  "fieldMapping": {
    "title": {
      "required": true,
      "fallbacks": ["artist", "event-name", "show-title"]
    },
    "date": {
      "required": true,
      "format": "auto", // "YYYY-MM-DD", "MM/DD/YYYY", "auto"
      "fallbacks": ["event-date", "show-date"]
    },
    "time": {
      "required": false,
      "format": "auto", // "HH:mm", "h:mm A", "auto"
      "defaultValue": "TBA"
    },
    "price": {
      "required": false,
      "extractNumbers": true,
      "currency": "USD",
      "defaultValue": "TBA"
    },
    "ticketLink": {
      "required": false,
      "makeAbsolute": true,
      "validateUrl": true
    }
  },
  "filters": {
    "futureOnly": true,
    "minDaysAhead": 0,
    "maxDaysAhead": 365,
    "excludeKeywords": ["cancelled", "postponed", "sold out"],
    "includeKeywords": ["concert", "music", "show"]
  }
}

// Response
{
  "success": true,
  "url": "https://venue-website.com/events",
  "venueName": "Custom Venue Name",
  "events": [
    {
      "id": "custom-venue-2024-03-15-artist-name",
      "title": "Artist Name",
      "date": "2024-03-15",
      "time": "20:00",
      "price": "$25-45",
      "ticketLink": "https://venue-website.com/tickets/123",
      "description": "Concert description...",
      "venue": "Custom Venue Name",
      "source": "firecrawl",
      "scrapedAt": "2024-03-01T10:00:00Z"
    }
  ],
  "count": 12,
  "method": "firecrawl",
  "scrapedAt": "2024-03-01T10:00:00Z"
}
```

### Status Monitoring
```javascript
GET /api/scrape/status

// Response
{
  "venues": {
    "orangepeel": {
      "lastScraped": "2024-03-01T10:00:00Z",
      "status": "success",
      "eventCount": 25,
      "method": "firecrawl"
    },
    "caverns": {
      "lastScraped": "2024-03-01T10:15:00Z", 
      "status": "failed",
      "error": "Rate limit exceeded",
      "method": "puppeteer"
    }
  }
}
```

## Flexible Extraction System

### Overview
The custom scraping endpoint allows you to scrape any venue website by providing the URL and extraction configuration. This makes the system venue-agnostic and highly configurable.

### Extraction Configuration Structure

#### Method Selection
```javascript
"extractionConfig": {
  "method": "auto" // "firecrawl", "puppeteer", or "auto"
}
```
- **auto**: Try Firecrawl first, fallback to Puppeteer
- **firecrawl**: Use only AI-powered extraction
- **puppeteer**: Use only traditional CSS selectors

#### Firecrawl Configuration
```javascript
"firecrawl": {
  "extractionPrompt": "Extract upcoming music events. For each event find: artist name, date, time, ticket price, and purchase link.",
  "waitTime": 3000,
  "extractionSchema": {
    "events": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "date": { "type": "string" },
          "time": { "type": "string" },
          "price": { "type": "string" },
          "ticketLink": { "type": "string" }
        }
      }
    }
  }
}
```

#### Puppeteer Configuration
```javascript
"puppeteer": {
  "selectors": {
    "container": ".event-item, .event-card, .show-listing",
    "title": ".title, .event-title, h2, h3",
    "date": ".date, .event-date, time[datetime]",
    "time": ".time, .event-time, .doors",
    "price": ".price, .cost, .ticket-price, .price-range",
    "ticketLink": "a[href*='ticket'], .buy-now, .purchase",
    "description": ".description, .event-details, .summary"
  },
  "waitForSelector": ".event-item",
  "waitTime": 2000,
  "scrollToBottom": false,
  "infiniteScroll": false
}
```

### Field Mapping & Validation

#### Field Configuration Options
```javascript
"fieldMapping": {
  "title": {
    "required": true,
    "fallbacks": ["artist", "event-name", "show-title"],
    "transforms": ["trim", "removeExtraSpaces"],
    "validation": {
      "minLength": 2,
      "maxLength": 200
    }
  },
  "date": {
    "required": true,
    "format": "auto", // "YYYY-MM-DD", "MM/DD/YYYY", "DD/MM/YYYY", "auto"
    "fallbacks": ["event-date", "show-date"],
    "transforms": ["parseDate"],
    "validation": {
      "futureOnly": true,
      "withinDays": 365
    }
  },
  "time": {
    "required": false,
    "format": "auto", // "HH:mm", "h:mm A", "HH:mm:ss", "auto"
    "defaultValue": "TBA",
    "transforms": ["parseTime", "convertTo24Hour"],
    "validation": {
      "validTimeFormat": true
    }
  },
  "price": {
    "required": false,
    "extractNumbers": true,
    "currency": "USD",
    "defaultValue": "TBA",
    "transforms": ["extractPrice", "formatCurrency"],
    "validation": {
      "reasonableRange": [0, 1000]
    }
  },
  "ticketLink": {
    "required": false,
    "makeAbsolute": true,
    "validateUrl": true,
    "transforms": ["normalizeUrl"],
    "validation": {
      "isValidUrl": true,
      "allowedDomains": ["*"] // or specific domains
    }
  }
}
```

### Content Filters

#### Event Filtering Options
```javascript
"filters": {
  "futureOnly": true,
  "minDaysAhead": 0,
  "maxDaysAhead": 365,
  "excludeKeywords": ["cancelled", "postponed", "sold out", "private event"],
  "includeKeywords": ["concert", "music", "show", "live"],
  "priceRange": {
    "min": 0,
    "max": 500
  },
  "dayOfWeek": [], // ["friday", "saturday", "sunday"] or empty for all
  "timeRange": {
    "earliest": "18:00",
    "latest": "23:59"
  }
}
```

### Implementation Examples

#### Simple Music Venue
```javascript
POST /api/scrape/custom
{
  "url": "https://musicvenue.com/events",
  "venueName": "The Music Hall",
  "extractionConfig": {
    "method": "firecrawl",
    "firecrawl": {
      "extractionPrompt": "Find all upcoming concerts. Extract artist name, date, time, and ticket price for each show."
    }
  }
}
```

#### Complex Multi-Event Venue
```javascript
POST /api/scrape/custom
{
  "url": "https://artscomplex.com/calendar",
  "venueName": "Arts Complex",
  "extractionConfig": {
    "method": "puppeteer",
    "puppeteer": {
      "selectors": {
        "container": ".calendar-event",
        "title": ".event-title",
        "date": ".event-date",
        "time": ".event-time",
        "price": ".ticket-price",
        "ticketLink": ".buy-tickets a"
      }
    }
  },
  "filters": {
    "includeKeywords": ["concert", "music", "band", "artist"],
    "excludeKeywords": ["comedy", "theater", "lecture"]
  }
}
```

#### Festival or Multi-Day Event
```javascript
POST /api/scrape/custom
{
  "url": "https://festival.com/lineup",
  "venueName": "Summer Music Festival",
  "extractionConfig": {
    "method": "auto",
    "firecrawl": {
      "extractionPrompt": "Extract festival lineup with each artist's performance date and time. Include ticket information."
    }
  },
  "fieldMapping": {
    "title": {
      "transforms": ["removeStageInfo", "trim"]
    },
    "date": {
      "format": "YYYY-MM-DD"
    }
  }
}
```

### Error Handling & Validation

#### Common Validation Errors
```javascript
// Response with validation errors
{
  "success": false,
  "error": "Validation failed",
  "validationErrors": [
    {
      "field": "date",
      "value": "invalid-date",
      "error": "Unable to parse date format"
    },
    {
      "field": "title",
      "value": "",
      "error": "Title is required but was empty"
    }
  ],
  "partialResults": {
    "validEvents": 8,
    "invalidEvents": 3,
    "events": [...] // Only valid events
  }
}
```

#### Extraction Failures
```javascript
// Response when extraction partially fails
{
  "success": true,
  "warnings": [
    "3 events were excluded due to missing required fields",
    "Price information unavailable for 5 events"
  ],
  "extractionStats": {
    "totalElementsFound": 15,
    "successfulExtractions": 12,
    "validatedEvents": 10,
    "filteredEvents": 2
  }
}
```

### Configuration Presets

#### Save and Reuse Configurations
```javascript
// Save a working configuration as a preset
POST /api/scrape/presets
{
  "name": "standard-music-venue",
  "description": "Standard configuration for most music venues",
  "config": {
    "extractionConfig": { ... },
    "fieldMapping": { ... },
    "filters": { ... }
  }
}

// Use a preset with custom URL
POST /api/scrape/custom
{
  "url": "https://newvenue.com/events",
  "venueName": "New Venue",
  "preset": "standard-music-venue",
  "overrides": {
    "extractionConfig": {
      "puppeteer": {
        "selectors": {
          "container": ".event-row" // Override just the container selector
        }
      }
    }
  }
}
```

## Data Processing Pipeline

### Validation Service
- Validate event data structure
- Check for required fields
- Ensure dates are in the future
- Normalize data formats

### Deduplication Service
- Compare events across scraping runs
- Detect similar events using title/date/venue matching
- Prevent duplicate entries in database

### Quality Metrics
- Track scraping success rates
- Monitor data completeness
- Measure extraction accuracy
- Alert on quality degradation

## Implementation Benefits

### Flexibility
- **Universal venue support** with custom extraction rules
- **Dynamic configuration** without code changes
- **Multiple extraction methods** (AI + traditional selectors)
- **Configurable validation** and data transformation
- **Reusable presets** for similar venue types

### Reliability
- Multiple scraping methods with automatic fallback
- Better error handling and retry mechanisms
- Health monitoring and alerting
- Graceful degradation with partial results

### Scalability  
- API-driven scraping allows remote triggering
- Cloud-based Firecrawl reduces infrastructure needs
- Concurrent processing with rate limiting
- **Venue-agnostic design** scales to unlimited venues

### Maintainability
- Service-oriented architecture with clear separation
- Configuration-driven venue management
- Comprehensive logging and monitoring
- **No hardcoded venue logic** - everything configurable

### Data Quality
- AI-powered extraction reduces CSS selector brittleness
- Validation pipeline ensures data consistency
- Deduplication prevents duplicate events
- **Field-level validation** and transformation
- **Content filtering** removes irrelevant events

## Next.js Project Structure

### App Router File Organization
```
concert-aggregator/
├── app/
│   ├── (dashboard)/                    # Route group for dashboard
│   │   ├── page.tsx                    # Dashboard page
│   │   └── analytics/
│   │       └── page.tsx                # Analytics page
│   ├── events/
│   │   ├── page.tsx                    # Events list page
│   │   ├── [id]/
│   │   │   └── page.tsx                # Event details page
│   │   └── loading.tsx                 # Loading component
│   ├── venues/
│   │   ├── page.tsx                    # Venues list
│   │   └── [slug]/
│   │       └── page.tsx                # Venue details
│   ├── api/                            # API routes
│   │   ├── events/
│   │   │   ├── route.ts                # GET /api/events
│   │   │   └── [id]/
│   │   │       └── route.ts            # GET /api/events/[id]
│   │   ├── scrape/                     # Scraping endpoints
│   │   │   ├── custom/
│   │   │   │   └── route.ts            # POST /api/scrape/custom
│   │   │   ├── venue/
│   │   │   │   └── [venueId]/
│   │   │   │       └── route.ts        # POST /api/scrape/venue/[venueId]
│   │   │   ├── all/
│   │   │   │   └── route.ts            # POST /api/scrape/all
│   │   │   └── status/
│   │   │       └── route.ts            # GET /api/scrape/status
│   │   └── venues/
│   │       └── route.ts                # GET /api/venues
│   ├── globals.css                     # Global styles and Bootstrap customizations
│   ├── layout.tsx                      # Root layout
│   └── page.tsx                        # Home page
├── components/                         # Reusable components
│   ├── ui/                            # Bootstrap 5 UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Form.tsx
│   ├── events/                        # Event-related components
│   │   ├── event-card.tsx
│   │   ├── event-list.tsx
│   │   └── event-filters.tsx
│   ├── scraping/                      # Scraping-related components
│   │   ├── scrape-trigger.tsx
│   │   └── scrape-status.tsx
│   └── dashboard/                     # Dashboard components
│       ├── analytics-chart.tsx
│       └── venue-cards.tsx
├── lib/                               # Utility functions and services
│   ├── scraping/                      # Scraping services
│   │   ├── firecrawl-service.ts
│   │   ├── puppeteer-service.ts
│   │   └── hybrid-service.ts
│   ├── validation/                    # Validation utilities
│   │   ├── scraping-validation.ts
│   │   └── event-validation.ts
│   ├── config/                        # Configuration
│   │   ├── venues.ts
│   │   └── database.ts
│   ├── utils.ts                       # General utilities
│   └── db.ts                          # Database connection
├── types/                             # TypeScript types
│   ├── events.ts
│   ├── venues.ts
│   └── scraping.ts
├── hooks/                             # Custom React hooks
│   ├── use-events.ts
│   └── use-scraping-status.ts
├── .env.local                         # Environment variables
├── next.config.js                     # Next.js configuration
├── package.json
├── bootstrap.config.js                # Bootstrap 5 customization (optional)
└── tsconfig.json                      # TypeScript config
```

### Key Benefits of Next.js App Router
- **File-based routing** with nested layouts
- **Server Components** for optimized data fetching
- **Streaming** and **Suspense** for better UX
- **Built-in API routes** eliminate need for separate backend
- **Static and dynamic rendering** options
- **Edge runtime** support for global deployment

## Configuration Management

### Environment Variables
**File: `.env.local`**
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Firecrawl Configuration
FIRECRAWL_API_KEY=your_firecrawl_api_key
FIRECRAWL_BASE_URL=https://api.firecrawl.dev

# Scraping Configuration
SCRAPING_RATE_LIMIT=5 # requests per minute
SCRAPING_TIMEOUT=30000 # 30 seconds
SCRAPING_RETRY_ATTEMPTS=3

# Template Configuration (adaptable for other CRUD apps)
APP_NAME=Concert Aggregator
APP_DOMAIN=concerts # Used for routing and branding
MAIN_ENTITY=events # Main data entity (events, products, jobs, etc.)
PROVIDER_ENTITY=venues # Data provider entity (venues, stores, companies, etc.)

# Optional: External Services
GOOGLE_ANALYTICS_ID=your-ga-id
SENTRY_DSN=your-sentry-dsn
```

### Venue Configuration
**File: `lib/config/venues.ts`**
```typescript
export interface VenueConfig {
  name: string;
  url: string;
  enabled: boolean;
  scrapers: ('firecrawl' | 'puppeteer')[];
  schedule: string;
  firecrawl?: {
    extractionPrompt: string;
    waitTime?: number;
  };
  puppeteer?: {
    selectors: {
      container: string;
      title: string;
      date: string;
      time?: string;
      price?: string;
      ticketLink?: string;
    };
    waitForSelector?: string;
    waitTime?: number;
  };
}

export const venueConfigs: Record<string, VenueConfig> = {
  orangepeel: {
    name: "The Orange Peel",
    url: "https://theorangepeel.net/events/",
    enabled: true,
    scrapers: ["firecrawl", "puppeteer"],
    schedule: "0 */6 * * *",
    firecrawl: {
      extractionPrompt: "Extract upcoming concert events with artist, date, time, and ticket info",
      waitTime: 3000
    },
    puppeteer: {
      selectors: {
        container: ".eventMainWrapper",
        title: "#eventTitle",
        date: "#eventDate",
        time: ".eventDateDetails"
      },
      waitForSelector: ".eventMainWrapper"
    }
  },
  caverns: {
    name: "The Caverns",
    url: "https://www.thecaverns.com/events",
    enabled: true,
    scrapers: ["firecrawl", "puppeteer"],
    schedule: "0 */6 * * *",
    firecrawl: {
      extractionPrompt: "Extract concert and event listings with artist, date, time, and pricing",
      waitTime: 3000
    }
  }
  // ... other venues
};

export function getVenueConfig(venueId: string): VenueConfig | null {
  return venueConfigs[venueId] || null;
}

export function getAllVenueIds(): string[] {
  return Object.keys(venueConfigs).filter(id => venueConfigs[id].enabled);
}
```

## Migration Strategy

### Step 1: Parallel Implementation
- Keep existing Puppeteer scripts running
- Implement new API endpoints alongside
- Test data quality and consistency
- **Example**: Convert Orange Peel scraper to custom endpoint:
  ```javascript
  POST /api/scrape/custom
  {
    "url": "https://theorangepeel.net/events/",
    "venueName": "The Orange Peel",
    "extractionConfig": {
      "method": "auto",
      "firecrawl": {
        "extractionPrompt": "Extract concert events with artist, date, time, and ticket info"
      },
      "puppeteer": {
        "selectors": {
          "container": ".eventMainWrapper",
          "title": "#eventTitle", 
          "date": "#eventDate",
          "time": ".eventDateDetails"
        }
      }
    }
  }
  ```

### Step 2: Gradual Transition
- Start using new endpoints for manual scraping
- Compare results between old and new methods
- Fine-tune extraction prompts and validation

### Step 3: Full Migration
- **Replace npm scripts with Next.js API calls**:
  ```bash
  # Old way
  npm run generatejson
  
  # New way - call Next.js API endpoints
  curl -X POST http://localhost:3000/api/scrape/all
  ```
- **Set up automated scheduling** with Next.js API routes or external cron jobs
- **Update package.json scripts**:
  ```json
  {
    "scripts": {
      "dev": "next dev",
      "build": "next build", 
      "start": "next start",
      "scrape": "curl -X POST http://localhost:3000/api/scrape/all",
      "scrape:orangepeel": "curl -X POST http://localhost:3000/api/scrape/venue/orangepeel"
    }
  }
  ```
- Decommission old scraping scripts

### Step 4: Enhancement
- Add real-time scraping triggers
- Implement advanced analytics
- Add machine learning for data quality

This modernized scraping system provides a robust foundation for reliable, scalable event data collection while maintaining backward compatibility and adding intelligent fallback mechanisms. 