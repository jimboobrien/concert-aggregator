import fs from 'fs/promises';
import { DataPersistenceService } from '@/services/data-persistence';
import { ConcertEvent } from '@/types';

/**
 * Import JSON concert data from a file and save it in our standardized format
 * 
 * @param filePath Path to the JSON file to import
 * @param sourceUrl The original URL the data was scraped from
 * @param customFilename Optional custom filename for the saved file
 * @returns Path to the saved standardized file
 */
export async function importJsonFile(
  filePath: string,
  sourceUrl: string,
  customFilename?: string
): Promise<string> {
  try {
    // Read the source file
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);
    
    // Use our data persistence service to save in standardized format
    const persistenceService = new DataPersistenceService();
    return await persistenceService.saveRawJsonToFile(sourceUrl, jsonData, customFilename);
  } catch (error) {
    console.error(`Error importing JSON file from ${filePath}:`, error);
    throw new Error(`Failed to import JSON file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Import JSON concert data from a URL and save it in our standardized format
 * 
 * @param jsonUrl URL of the JSON data to import
 * @param sourceUrl The original URL the data was scraped from (defaults to jsonUrl)
 * @param customFilename Optional custom filename for the saved file
 * @returns Path to the saved standardized file
 */
export async function importJsonFromUrl(
  jsonUrl: string,
  sourceUrl?: string,
  customFilename?: string
): Promise<string> {
  try {
    // Fetch the JSON data from URL
    const response = await fetch(jsonUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch JSON: ${response.status} ${response.statusText}`);
    }
    
    const jsonData = await response.json();
    
    // Use our data persistence service to save in standardized format
    const persistenceService = new DataPersistenceService();
    return await persistenceService.saveRawJsonToFile(
      sourceUrl || jsonUrl, 
      jsonData, 
      customFilename
    );
  } catch (error) {
    console.error(`Error importing JSON from URL ${jsonUrl}:`, error);
    throw new Error(`Failed to import JSON from URL: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Process raw concert data from any source and normalize it to our standard format
 * 
 * @param rawEvents Array of events that may not match our exact schema
 * @param sourceUrl The original URL the data was scraped from
 * @returns Array of standardized ConcertEvent objects
 */
export function normalizeEventData(
  rawEvents: Array<Record<string, unknown>>,
  sourceUrl: string
): ConcertEvent[] {
  // Extract the venue name from the URL (or use a default)
  const venueMatch = sourceUrl.match(/\/\/(?:www\.)?([^\/]+)/);
  const defaultVenue = venueMatch ? venueMatch[1].replace(/\.(com|org|net)$/, '') : 'unknown-venue';
  
  return rawEvents.map(event => {
    // Handle different possible field names in source data
    const title = getStringValue(event, ['title', 'name', 'event_name', 'event_title']);
    const date = getStringValue(event, ['date', 'event_date', 'start_date', 'startDate']);
    const url = getStringValue(event, ['url', 'link', 'event_url', 'ticket_url', 'ticketUrl']);
    const venue = getStringValue(event, ['venue', 'venue_name', 'location']) || defaultVenue;
    
    // Return a normalized event object
    return {
      title,
      date,
      venue,
      url
    };
  });
}

/**
 * Helper function to extract a string value from an object using different possible keys
 */
function getStringValue(obj: Record<string, unknown>, possibleKeys: string[]): string {
  for (const key of possibleKeys) {
    if (key in obj && typeof obj[key] === 'string') {
      return obj[key] as string;
    }
  }
  return '';
} 