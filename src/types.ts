export interface ScrapedData {
  url: string;
  timestamp: string;
  metadata: Record<string, unknown>;
  json: {
    events: ConcertEvent[];
    [key: string]: string | ConcertEvent[];
  } | null;
  markdown: string | null;
}

export interface StorageOptions {
  saveToJson: boolean;
  saveToSupabase: boolean;
  detectVenue?: boolean;
  useCache?: boolean;
}

export interface ConcertEvent {
  title: string;
  date: string;
  url?: string;
  ticketUrl?: string;
  scrapedAt?: string;
}

export interface CrawlConfig {
  mode: 'ai_prompt' | 'selectors';
  prompt?: string;
  schema?: SelectorSchema;
}

// Type alias for backward compatibility
export type ScrapedEvent = ConcertEvent;

export interface SelectorSchema {
  [key: string]: string;
} 