import { createAdminClient } from './supabase/admin-client';
import { FirecrawlService } from '@/services/firecrawl';
import { checkVenueSimilarity } from './openrouter-client';

/**
 * Extracts the domain from a URL
 * @param url The URL to extract the domain from
 * @returns The domain (without www. prefix)
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    console.error('Invalid URL:', url);
    return url; // Return the original string if it's not a valid URL
  }
}

/**
 * Attempts to find a venue name from a domain
 * @param domain The domain to extract a venue name from
 * @returns A best guess at the venue name
 */
export function extractVenueNameFromDomain(domain: string): string {
  // Remove common TLDs
  const withoutTLD = domain.replace(/\.(com|org|net|co|io|us|uk|gov)$/, '');
  
  // Split by dots and dashes
  const parts = withoutTLD.split(/[.-]/);
  
  // If we have multiple parts, use the one that's most likely the venue name
  // (typically the second-to-last part for subdomains)
  if (parts.length > 1) {
    // Use the second-to-last part as it's often the main domain name
    const mainPart = parts[parts.length - 2];
    
    // Capitalize the first letter of each word
    return mainPart
      .split(/[_\s]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  // If there's only one part, capitalize it
  return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
}

/**
 * Finds or creates a venue based on URL
 * @param url The URL of the venue website
 * @param venueName Optional venue name (if known)
 * @returns The venue object with id
 */
export async function findOrCreateVenue(url: string, venueName?: string): Promise<{ id: string; name: string; isNew: boolean; city?: string; state?: string }> {
  const supabase = createAdminClient();
  const domain = extractDomain(url);
  
  // First try to find by exact URL
  const { data: venueByUrl } = await supabase
    .from('venues')
    .select('id, name, city, state')
    .eq('url', url)
    .single();
  
  if (venueByUrl) {
    return { ...venueByUrl, isNew: false };
  }
  
  // Then try to find by domain
  const { data: venueByDomain } = await supabase
    .from('venues')
    .select('id, name, city, state')
    .eq('website_domain', domain)
    .single();
  
  if (venueByDomain) {
    // Update the venue with the exact URL if it was found by domain
    await supabase
      .from('venues')
      .update({ url })
      .eq('id', venueByDomain.id);
    
    return { ...venueByDomain, isNew: false };
  }
  
  // Get all existing venue names for duplicate detection
  const { data: allVenues } = await supabase
    .from('venues')
    .select('name');
  
  const existingVenueNames = allVenues?.map(v => v.name) || [];
  
  // If not found, create a new venue with location data from Firecrawl
  try {
    // Use Firecrawl to extract venue information
    const firecrawlService = new FirecrawlService();
    const venueInfo = await firecrawlService.extractVenueInfo(url);
    
    // Use the extracted name or fallback to provided name or domain-based name
    const extractedName = venueName || venueInfo.name || extractVenueNameFromDomain(domain);
    
    // Check for duplicate venues using AI
    const similarityCheck = await checkVenueSimilarity(extractedName, existingVenueNames);
    
    // If it's a duplicate with high confidence, find and return the existing venue
    if (similarityCheck.isDuplicate && similarityCheck.duplicateOf && similarityCheck.confidence && similarityCheck.confidence > 0.7) {
      console.log(`Detected duplicate venue: "${extractedName}" is similar to "${similarityCheck.duplicateOf}" (confidence: ${similarityCheck.confidence})`);
      
      // Find the existing venue
      const { data: existingVenue } = await supabase
        .from('venues')
        .select('id, name, city, state, url')
        .ilike('name', similarityCheck.duplicateOf)
        .single();
      
      if (existingVenue) {
        // Update the venue with the new URL if not already set
        if (existingVenue.url === null) {
          await supabase
            .from('venues')
            .update({ url })
            .eq('id', existingVenue.id);
        }
        
        return { ...existingVenue, isNew: false };
      }
    }
    
    // Use the normalized name from AI if available
    const finalName = similarityCheck.normalizedName || extractedName;
    
    // Create a new venue
    const { data: newVenue, error } = await supabase
      .from('venues')
      .insert({
        name: finalName,
        url,
        website_domain: domain,
        city: venueInfo.city,
        state: venueInfo.state,
        country: venueInfo.country || 'USA'
      })
      .select('id, name, city, state')
      .single();
    
    if (error) {
      console.error('Error creating venue:', error);
      throw new Error(`Failed to create venue: ${error.message}`);
    }
    
    return { ...newVenue, isNew: true };
  } catch (error) {
    console.error('Error extracting venue info:', error);
    
    // Fallback to creating venue without location data
    const name = venueName || extractVenueNameFromDomain(domain);
    
    // Check for duplicate venues using AI
    try {
      const similarityCheck = await checkVenueSimilarity(name, existingVenueNames);
      
      // If it's a duplicate with high confidence, find and return the existing venue
      if (similarityCheck.isDuplicate && similarityCheck.duplicateOf && similarityCheck.confidence && similarityCheck.confidence > 0.7) {
        console.log(`Detected duplicate venue: "${name}" is similar to "${similarityCheck.duplicateOf}" (confidence: ${similarityCheck.confidence})`);
        
        // Find the existing venue
        const { data: existingVenue } = await supabase
          .from('venues')
          .select('id, name, city, state, url')
          .ilike('name', similarityCheck.duplicateOf)
          .single();
        
        if (existingVenue) {
          // Update the venue with the new URL if not already set
          if (existingVenue.url === null) {
            await supabase
              .from('venues')
              .update({ url })
              .eq('id', existingVenue.id);
          }
          
          return { ...existingVenue, isNew: false };
        }
      }
      
      // Use the normalized name from AI if available
      const finalName = similarityCheck.normalizedName || name;
      
      // Create a new venue with the normalized name
      const { data: newVenue, error: insertError } = await supabase
        .from('venues')
        .insert({
          name: finalName,
          url,
          website_domain: domain
        })
        .select('id, name')
        .single();
      
      if (insertError) {
        console.error('Error creating venue:', insertError);
        throw new Error(`Failed to create venue: ${insertError.message}`);
      }
      
      return { ...newVenue, isNew: true };
    } catch (aiError) {
      console.error('Error with AI duplicate detection:', aiError);
      
      // Final fallback - just create the venue with the original name
      const { data: newVenue, error: insertError } = await supabase
        .from('venues')
        .insert({
          name,
          url,
          website_domain: domain
        })
        .select('id, name')
        .single();
      
      if (insertError) {
        console.error('Error creating venue:', insertError);
        throw new Error(`Failed to create venue: ${insertError.message}`);
      }
      
      return { ...newVenue, isNew: true };
    }
  }
}

/**
 * Records a scrape in the venue_scrape_history table
 * @param venueId The ID of the venue
 * @param url The URL that was scraped
 * @param eventsCount The number of events found
 */
export async function recordVenueScrape(venueId: string, url: string, eventsCount: number): Promise<void> {
  const supabase = createAdminClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
  
  // Record the scrape
  const { error } = await supabase
    .from('venue_scrape_history')
    .insert({
      venue_id: venueId,
      url,
      events_count: eventsCount,
      user_id: userId
    });
  
  if (error) {
    console.error('Error recording venue scrape:', error);
    // Don't throw an error, just log it - we don't want to fail the scrape if this fails
  }
} 