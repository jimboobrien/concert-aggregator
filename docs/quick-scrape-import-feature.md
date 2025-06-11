# Quick Scrape and Import Feature Documentation

## Overview

The Quick Scrape and Import feature provides users with a simple way to extract concert event data from venue websites and store it for later use. This document details the implementation, data flow, and storage paradigms used within the system.

## Architecture

The system consists of several interconnected components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  User Interface │───▶│   API Routes    │───▶│ FirecrawlService│
│  (Quick Scrape) │    │   (Scraping)    │    │   (Extraction)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  JSON Files     │◀───│    Data         │◀───│  Formatted Data │
│  (Local Storage)│    │ Persistence     │    │  (Standardized) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                      ┌─────────────────┐
                      │   Supabase DB   │
                      │  (PostgreSQL)   │
                      └─────────────────┘
```

## Data Flow

1. **User Interaction**: User enters a URL in the Quick Scrape form on the dashboard
2. **API Request**: The application sends a request to the `/api/scrape` endpoint
3. **Data Extraction**: The FirecrawlService extracts event data using AI-powered techniques
4. **Data Formatting**: The extracted data is standardized into a consistent format
5. **Data Persistence**: The formatted data is saved according to user preferences (JSON file, Supabase, or both)

## Data Persistence Paradigms

The system supports multiple persistence mechanisms to provide flexibility for different use cases:

### 1. Local JSON Files

When data is saved locally, it's stored in the `scraped-data` directory with a standardized format:

```json
{
  "url": "https://venue-website.com",
  "timestamp": "2024-06-08T06:11:31.408Z",
  "metadata": {
    "sourceURL": "https://venue-website.com",
    "scrapeId": "1234567890-abcde"
  },
  "json": {
    "events": [
      {
        "title": "Concert Title",
        "date": "2024-06-15",
        "venue": "Venue Name",
        "url": "https://ticket-url.com/concert"
      }
    ]
  },
  "markdown": null
}
```

Benefits of local JSON storage:
- Easy to inspect and debug
- No database dependencies
- Portable across systems
- Supports version control

### 2. Supabase Database Storage

When data is saved to Supabase, it's transformed to match the database schema:

```sql
-- Events are stored in the 'events' table with this structure
{
  "title": "Concert Title",
  "event_date": "2024-06-15T00:00:00.000Z",
  "url": "https://ticket-url.com/concert",
  "venue_id": "venue-identifier",
  "artist_id": null,
  "description": null,
  "scraped_at": "2024-06-08T06:11:31.408Z"
}
```

Benefits of Supabase storage:
- Centralized data repository
- Supports real-time updates
- Enables complex queries and filters
- Integrates with authentication and authorization
- Supports deduplication through conflict resolution

## FireCrawl Service

The FireCrawl service is the engine behind our scraping capabilities:

### AI-Powered Extraction

The system uses a modern AI-based approach to extract structured data from websites:

1. **AI Prompt Mode**: 
   - Uses natural language prompts to guide extraction
   - Example: "Extract all concert events with title, date, and ticket link"
   - More flexible and adaptable to different website structures
   - Handles changes in website layouts automatically

2. **Selector Mode** (Planned):
   - Uses CSS selectors for precise extraction
   - Example: `.event-container .title`
   - More efficient for sites with consistent structure
   - Currently implemented as a placeholder for future development

3. **Fallback Mechanism**:
   - If AI-based extraction fails, the system attempts a basic extraction
   - Ensures some data is returned even when the primary method fails

## Storage Options

Users can choose from multiple storage options:

1. **JSON Only**: Saves data to a local JSON file only
2. **Supabase Only**: Saves data directly to the Supabase database
3. **Both**: Saves data to both JSON and Supabase

## Differences Between Local and Supabase Storage

| Feature | Local JSON | Supabase Database |
|---------|------------|-------------------|
| Format | Complete scrape metadata | Database-optimized structure |
| Access | File system | API/SDK access |
| Querying | Manual parsing | SQL queries |
| Updates | Requires file operations | Real-time subscriptions |
| Deduplication | Manual | Automatic via constraints |
| Integration | Standalone | Connected to application |
| Persistence | Until deleted | Database lifecycle |

## Data Transformation

The system includes utilities to transform data between different formats:

1. **`formatScrapedData`**: Standardizes extracted events into a consistent ScrapedData structure
2. **`prepareForSupabase`**: Converts the standardized structure into a format suitable for database insertion

## Supported JSON Formats for Import

The import utility can handle various JSON formats:

1. **Standard Format** (Preferred):
   - Complete metadata and events structure
   - Used by the scraping system

2. **Simple Events Array**:
   - Array of event objects
   - Minimal format for quick imports

3. **Object with Events Array**:
   - Object containing an events array
   - Intermediate format

## Implementation Details

### Key Components:

1. **UI Components**:
   - Quick Scrape form on Dashboard (`src/app/dashboard/client-page.tsx`)
   - Advanced Import Options page (`src/app/dashboard/import/page.tsx`)

2. **API Routes**:
   - `/api/scrape` - Main scraping endpoint
   - `/api/import-json` - JSON import endpoint

3. **Services**:
   - `FirecrawlService` - Handles extraction of data from websites
   - `DataPersistenceService` - Manages saving data to files and Supabase

4. **Utilities**:
   - `formatScrapedData` - Standardizes data format
   - `prepareForSupabase` - Prepares data for database insertion

### Code Flow:

```
User → Dashboard → API Route → FirecrawlService → DataPersistenceService → Storage
```

## Best Practices

1. **Always save to both JSON and Supabase** for critical data to ensure redundancy
2. **Use structured data formats** when possible to maintain consistency
3. **Include venue information** when scraping to enable proper data organization
4. **Normalize dates** to ISO format for consistent handling
5. **Handle duplicates** through Supabase's conflict resolution 