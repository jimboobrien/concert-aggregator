# JSON Import Utility Examples

This document provides examples of how to use the JSON import utility to standardize concert data from various sources into our application's format.

## Standardized JSON Format

Our application uses a standardized JSON format for all concert data:

```json
{
  "json": {
    "events": [
      {
        "title": "Concert Title",
        "date": "MonthDay",
        "venue": "Venue Name",
        "url": "https://ticket-url.com/concert"
      }
      // More events...
    ]
  },
  "url": "https://source-url.com",
  "timestamp": "2025-06-08T06:11:31.408Z",
  "metadata": {
    // Metadata from the source...
  }
}
```

## Using the Import Utility

The import utility can be used both from the command line and programmatically in your code.

### Command Line Examples

#### Import from a local JSON file:

```bash
npm run import-json -- --file=./data/raw-concerts.json --url=https://venue-website.com
```

#### Import from a JSON API endpoint:

```bash
npm run import-json -- --url=https://api.venue.com/events.json --source=https://venue.com
```

#### Specify a custom output filename:

```bash
npm run import-json -- --file=./data/concerts.json --url=https://venue.com --output=venue-standardized.json
```

### Programmatic Usage

You can also use the import utilities in your own code:

```typescript
import { importJsonFile, importJsonFromUrl } from '../src/utils/import-json';

// Import from a file
async function importFromFile() {
  try {
    const savedPath = await importJsonFile(
      './data/raw-concerts.json',
      'https://venue.com'
    );
    console.log(`Saved to ${savedPath}`);
  } catch (error) {
    console.error('Import failed:', error);
  }
}

// Import from a URL
async function importFromUrl() {
  try {
    const savedPath = await importJsonFromUrl(
      'https://api.venue.com/events.json',
      'https://venue.com'
    );
    console.log(`Saved to ${savedPath}`);
  } catch (error) {
    console.error('Import failed:', error);
  }
}
```

## Handling Different JSON Formats

The import utility can handle various JSON formats:

### Arrays of Events

```json
[
  {
    "title": "Concert 1",
    "date": "Jun10",
    "url": "https://tickets.com/1"
  },
  {
    "title": "Concert 2",
    "date": "Jul15",
    "url": "https://tickets.com/2"
  }
]
```

### Objects with Events Array

```json
{
  "events": [
    {
      "title": "Concert 1",
      "date": "Jun10",
      "url": "https://tickets.com/1"
    },
    {
      "title": "Concert 2",
      "date": "Jul15",
      "url": "https://tickets.com/2"
    }
  ]
}
```

### Already Standardized Format

If the data is already in our standardized format, it will be preserved as-is.

## Field Mapping

The utility automatically maps common field names to our standardized format:

| Our Field | Recognized Source Fields |
|-----------|--------------------------|
| title     | title, name, event_name, event_title |
| date      | date, event_date, start_date, startDate |
| url       | url, link, event_url, ticket_url, ticketUrl |
| venue     | venue, venue_name, location | 