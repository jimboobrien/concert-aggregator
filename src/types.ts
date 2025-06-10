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
}

export interface ConcertEvent {
  title: string;
  date: string;
  url?: string;
}

export interface CrawlConfig {
  mode: 'ai_prompt' | 'selectors';
  prompt?: string;
  schema?: SelectorSchema;
}

export interface ScrapedEvent {
  title: string;
  date: string;
  ticketUrl?: string;
  scrapedAt: string;
}

export interface SelectorSchema {
  [key: string]: string;
} 