# Importing JSON Data to Supabase

This document provides examples of how to use the import utility to directly import JSON concert data into your Supabase database.

## Prerequisites

Before using this import utility, ensure you have:

1. A valid Supabase setup with your environment variables properly configured
2. A venue ID from your Supabase database to associate the events with
3. JSON data in a format compatible with the import utility

## Command Line Usage

### Basic Import

The simplest way to import a JSON file to Supabase:

```bash
npm run import-to-supabase -- --file=./scraped-data/my-venue-data.json --venue-id=123e4567-e89b-12d3-a456-426614174000
```

### Options

The import utility supports several options:

- `--file` or `-f`: Path to the JSON file to import (required)
- `--venue-id` or `-v`: Supabase venue ID to associate events with (required)
- `--normalize` or `-n`: Whether to normalize data before inserting (default: true)
- `--yes` or `-y`: Skip the confirmation prompt
- `--help` or `-h`: Show help information

### Examples

#### Import with data normalization disabled

```bash
npm run import-to-supabase -- --file=./scraped-data/venues/orangepeel.json --venue-id=123e4567-e89b-12d3-a456-426614174000 --normalize=false
```

#### Batch import with auto-confirmation

```bash
npm run import-to-supabase -- --file=./scraped-data/batch/venue1.json --venue-id=123e4567-e89b-12d3-a456-426614174000 --yes
```

## Programmatic Usage

You can also use the import functionality programmatically in your own code:

```typescript
import { DataPersistenceService } from '../src/services/data-persistence';
import fs from 'fs';

async function importVenueData() {
  try {
    const dataPersistenceService = new DataPersistenceService();
    
    // Read your JSON data
    const jsonData = JSON.parse(fs.readFileSync('./scraped-data/my-venue.json', 'utf8'));
    
    // Import to Supabase
    const count = await dataPersistenceService.saveJsonToSupabase(
      jsonData,
      'your-venue-id-here',
      true // normalize data
    );
    
    console.log(`Imported ${count} events to Supabase`);
  } catch (error) {
    console.error('Import failed:', error);
  }
}

importVenueData();
```

## Supported JSON Formats

The import utility can handle various JSON formats:

### Standard Format (Preferred)

This is the standard format used by our scraping system:

```json
{
  "url": "https://venue-website.com",
  "timestamp": "2024-06-08T06:11:31.408Z",
  "metadata": {
    "sourceURL": "https://venue-website.com"
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
  }
}
```

### Simple Events Array

A simple array of events:

```json
[
  {
    "title": "Concert 1",
    "date": "2024-06-10",
    "url": "https://tickets.com/1"
  },
  {
    "title": "Concert 2",
    "date": "2024-07-15",
    "url": "https://tickets.com/2"
  }
]
```

### Object with Events Array

An object with an events array:

```json
{
  "events": [
    {
      "title": "Concert 1",
      "date": "2024-06-10",
      "url": "https://tickets.com/1"
    },
    {
      "title": "Concert 2",
      "date": "2024-07-15",
      "url": "https://tickets.com/2"
    }
  ]
}
```

## Data Normalization

When the `normalize` option is enabled (default), the import utility will:

1. Ensure event dates are in proper ISO format
2. Trim whitespace from string fields
3. Add import metadata (timestamp, source URL)
4. Handle duplicate detection with Supabase's conflict resolution

## Troubleshooting

### Common Issues

- **Connection errors**: Ensure your Supabase environment variables are correctly set
- **Invalid JSON**: Verify your JSON file has a valid format
- **Missing venue ID**: Make sure the venue exists in your Supabase database
- **Permission issues**: Check that your service role key has sufficient permissions

### Logging

If you encounter issues, check the console output for detailed error messages. For more verbose logging, you can examine the Supabase dashboard's logs. 