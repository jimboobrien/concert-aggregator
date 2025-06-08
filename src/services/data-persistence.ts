import fs from 'fs/promises';
import path from 'path';
import { ScrapedData } from '../types';

export class DataPersistenceService {
  private dataDir: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'scraped-data');
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      console.error('Error creating data directory:', error);
      throw new Error('Could not create data directory.');
    }
  }

  async save(data: ScrapedData): Promise<string> {
    await this.ensureDirectoryExists();
    const filename = `${new URL(data.url).hostname}-${Date.now()}.json`;
    const filePath = path.join(this.dataDir, filename);

    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return filePath;
    } catch (error) {
      console.error(`Error saving data to ${filePath}:`, error);
      throw new Error('Could not save scraped data.');
    }
  }
} 