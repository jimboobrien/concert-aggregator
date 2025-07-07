'use server';

import { createAdminClient } from '@/utils/supabase/admin-client';
import { isAdmin } from '@/utils/auth-helpers';
import { revalidatePath } from 'next/cache';

export async function deleteVenueAction(venueId: string, venueName: string) {
  // Check if the current user is an admin
  const userIsAdmin = await isAdmin();
  
  if (!userIsAdmin) {
    throw new Error('Unauthorized: Only admins can delete venues');
  }

  try {
    const supabase = createAdminClient();
    
    // First, get all followers of this venue
    const { data: followers, error: followersError } = await supabase
      .from('followed_venues')
      .select('user_id')
      .eq('venue_id', venueId);
    
    if (followersError) {
      console.error('Error fetching followers:', followersError);
    }
    
    // Delete related records manually in the correct order to avoid foreign key violations
    
    // 1. Delete from scraped_urls table (this was missing and causing the constraint violation)
    const { error: scrapedUrlsError } = await supabase
      .from('scraped_urls')
      .delete()
      .eq('venue_id', venueId);
    
    if (scrapedUrlsError) {
      console.error('Error deleting scraped URLs:', scrapedUrlsError);
    }
    
    // 2. Delete from events table (events associated with this venue)
    const { error: eventsError } = await supabase
      .from('events')
      .delete()
      .eq('venue_id', venueId);
    
    if (eventsError) {
      console.error('Error deleting events:', eventsError);
    }
    
    // 3. Delete from followed_venues table
    const { error: followedError } = await supabase
      .from('followed_venues')
      .delete()
      .eq('venue_id', venueId);
    
    if (followedError) {
      console.error('Error deleting followed venues:', followedError);
    }
    
    // 4. Delete from venue_scrape_history table (if it exists)
    const { error: scrapeHistoryError } = await supabase
      .from('venue_scrape_history')
      .delete()
      .eq('venue_id', venueId);
    
    if (scrapeHistoryError) {
      console.error('Error deleting venue scrape history:', scrapeHistoryError);
    }
    
    // 5. Finally, delete the venue
    const { error: venueError } = await supabase
      .from('venues')
      .delete()
      .eq('id', venueId);
    
    if (venueError) {
      throw venueError;
    }
    
    // If there were followers, we could implement similar logic to artist deletion
    // to reassign them to similar venues, but for now we'll just notify
    if (followers && followers.length > 0) {
      console.log(`Deleted venue ${venueName} had ${followers.length} followers`);
      // TODO: Implement venue follower reassignment logic if needed
    }
    
    // Revalidate the venue management page
    revalidatePath('/admin/venue-management');
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting venue:', error);
    throw error;
  }
}