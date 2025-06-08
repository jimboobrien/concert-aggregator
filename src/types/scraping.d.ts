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