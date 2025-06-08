interface LlmExtraction {
  events: {
    title: string;
    date: string;
    venue: string;
    url: string;
  }[];
}

export interface ScrapedData {
  json?: LlmExtraction;
  markdown?: string;
  url: string;
  timestamp: string;
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string;
  };
} 