# Hometown Music Tracker (formerly Concert Aggregator)

This project is a personalized concert tracking application designed to help you keep up with your favorite artists and venues in your hometown.

The goal is to move beyond generic event listings and create a focused, user-centric tool that answers one simple question: "What are the shows I *actually* care about that are happening near me?"

## Core Features

- **Personalized Feed**: The main dashboard shows you upcoming shows from only the artists and venues you choose to follow.
- **Venue Tracking**: Follow your favorite local music spots, from small clubs to large arenas.
- **Artist Tracking**: Follow specific artists to get notified when they announce a show in your town.
- **Automated Scraping**: Uses a flexible, modern scraping engine (`Firecrawl`) to automatically gather event data from venue websites.
- **Built with Next.js & Supabase**: A modern, full-stack application leveraging the best of the React ecosystem and a powerful BaaS.

## Project Status & Next Steps

The project is currently in **Phase 1** of development, focused on building the core data collection engine.

1.  **Phase 1: Core Scraping API**: Build the flexible, Firecrawl-powered scraping service.
2.  **Phase 2: User Accounts & Personalization**: Introduce user profiles and the ability to set a hometown and follow artists/venues.
3.  **Phase 3: The Personalized Feed**: Develop the main user-facing dashboard.

For detailed technical plans, see the `/docs` directory. Start with the [Phase 1 Implementation Guide](./docs/phase1-implementation.md).

## Overview

This project automatically collects concert listings from four popular music venues:
- **The Orange Peel** (Asheville, NC)
- **The Caverns** (Tennessee)
- **Terminal West** (Atlanta, GA)
- **District** (Venue location)

The application scrapes event data, generates JSON files, and presents all concerts in a responsive Bootstrap-based web interface with sorting capabilities.

## Features

- 🎵 **Multi-venue aggregation**: Collects events from 4 different concert venues
- 🕷️ **Web scraping**: Uses Puppeteer to extract event data from venue websites
- 📅 **Smart sorting**: Sort events by date or alphabetically by title
- 📱 **Responsive design**: Mobile-friendly Bootstrap 4 interface
- 🔄 **Automated data generation**: Single command to refresh all venue data
- 📊 **JSON data export**: Structured event data available as JSON files

## Project Structure

```
concerts/
├── index.html              # Main web interface
├── package.json            # Node.js dependencies and scripts
├── scripts/                # Web scraping scripts
│   ├── orangepeel.js       # The Orange Peel scraper
│   ├── thecaverns.js       # The Caverns scraper
│   ├── terminalwest.js     # Terminal West scraper
│   └── district.js         # District scraper
├── output/                 # Generated JSON data files
│   ├── orangepeel.json     # The Orange Peel events
│   ├── thecaverns.json     # The Caverns events
│   ├── terminalwest.json   # Terminal West events
│   └── district.json       # District events
└── README.md              # This documentation
```

## Installation

1. **Clone the repository** (if not already local):
   ```bash
   git clone <your-repo-url>
   cd concerts
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

## Usage

### Generate Fresh Concert Data

To scrape the latest concert listings from all venues:

```bash
npm start
```

This command runs all scraper scripts sequentially and updates the JSON files in the `output/` directory.

### View Concert Listings

1. Open `index.html` in your web browser
2. View concerts organized by venue in a 4-column layout
3. Use the sorting buttons:
   - **Sort by Date**: Organizes events chronologically
   - **Sort by Title**: Arranges events alphabetically

### Run Individual Scrapers

You can also run scrapers for specific venues:

```bash
# Individual venue scrapers
node scripts/orangepeel.js
node scripts/thecaverns.js
node scripts/terminalwest.js
node scripts/district.js
```

## How It Works

### 1. Web Scraping Process

Each venue has a dedicated scraper script that:
- Launches a headless Chromium browser using Puppeteer
- Navigates to the venue's events page
- Waits for content to load dynamically
- Extracts event information using CSS selectors
- Structures data into JSON format
- Saves results to the `output/` directory

### 2. Data Structure

Each event contains the following information:
```json
{
  "title": "Artist/Event Name",
  "date": "Event Date",
  "time": "Event Time",
  "location": "Venue Name"
}
```

### 3. Web Interface

The `index.html` file:
- Fetches JSON data from all venue files
- Displays events in a responsive 4-column Bootstrap grid
- Provides interactive sorting functionality
- Auto-sorts events by date on initial load

## Dependencies

- **Puppeteer** (^22.15.0): Web scraping and browser automation
- **Bootstrap 5**: Frontend CSS framework
- **jQuery**: JavaScript library for DOM manipulation (loaded via CDN)

## Technical Details

### Scraping Strategy

The application uses CSS selectors specific to each venue's website structure:
- Waits for dynamic content to load (`networkidle2`)
- Targets specific DOM elements containing event information
- Handles missing data gracefully (e.g., time information)

### Error Handling

- Scrapers continue execution if individual events fail to parse
- Missing time information defaults to 'N/A'
- Browser instances are properly closed after scraping

### Performance

- Headless browser mode for faster execution
- Parallel script execution when running `npm start`
- Minimal DOM manipulation in the frontend

## Customization

### Adding New Venues

1. Create a new scraper script in `scripts/` directory
2. Follow the existing pattern using Puppeteer
3. Add the script to the `generatejson` command in `package.json`
4. Update `index.html` to include the new venue's data

### Modifying Data Fields

Update the `page.evaluate()` function in scraper scripts to extract additional information like:
- Ticket prices
- Event descriptions
- Age restrictions
- Venue capacity

## Troubleshooting

**Scripts not running**: Ensure Puppeteer is properly installed with `npm install`

**No data appearing**: Check that venue websites haven't changed their HTML structure

**Browser errors**: Puppeteer may need additional dependencies on some Linux systems

## License

This project is licensed under the terms specified in the LICENSE file.