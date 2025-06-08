export interface ScrapedData {
  markdown: string;
  url: string;
  timestamp: string;
  metadata: {
    title?: string;
    description?: string;
    keywords?: string;
  };
} 