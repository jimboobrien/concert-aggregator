import { StorageOptions } from '@/types/scraping';
import { ScrapedEvent } from '@/types/scraping';
import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

export class DataPersistenceService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  async saveVenueData(
    options: StorageOptions,
    events: ScrapedEvent[]
  ) {
    const results = {
      jsonFile: null as string | null,
      database: false,
      errors: [] as string[]
    };

    // Save to JSON files
    if (options.saveToFiles) {
      try {
        const outputDir = options.outputDir || 'output';
        await fs.mkdir(outputDir, { recursive: true });
        
        const filePath = path.join(outputDir, options.fileName);
        await fs.writeFile(filePath, JSON.stringify(events, null, 2));
        
        results.jsonFile = filePath;
        console.log(`Saved ${events.length} events to ${filePath}`);
      } catch (error: any) {
        results.errors.push(`JSON save failed: ${error.message}`);
      }
    }

    // Save to Supabase (optional)
    if (options.saveToSupabase) {
      try {
        const { error } = await this.supabase
          .from('events')
          .upsert(
            events.map(event => ({
              ...event,
              venue_id: options.venueId,
              scraped_at: new Date().toISOString()
            })),
            { onConflict: 'title,date,venue_id' }
          );

        if (error) throw error;
        results.database = true;
        console.log(`Saved ${events.length} events to Supabase for venue ${options.venueId}`);
      } catch (error: any) {
        results.errors.push(`Supabase save failed: ${error.message}`);
      }
    }

    return results;
  }
} 