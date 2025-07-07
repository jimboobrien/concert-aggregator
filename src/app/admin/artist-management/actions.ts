'use server';

import { createAdminClient } from '@/utils/supabase/admin-client';
import { isAdmin } from '@/utils/auth-helpers';
import { revalidatePath } from 'next/cache';

export async function deleteArtistAction(artistId: string, artistName: string) {
  // Check if the current user is an admin
  const userIsAdmin = await isAdmin();
  
  if (!userIsAdmin) {
    throw new Error('Unauthorized: Only admins can delete artists');
  }

  try {
    const supabase = createAdminClient();
    
    // First, get all followers of this artist
    const { data: followers, error: followersError } = await supabase
      .from('followed_artists')
      .select('user_id')
      .eq('artist_id', artistId);
    
    if (followersError) {
      console.error('Error fetching followers:', followersError);
    }
    
    // Delete related records manually in the correct order to avoid foreign key violations
    
    // 1. Delete from events table
    const { error: eventsError } = await supabase
      .from('events')
      .delete()
      .eq('artist_id', artistId);
    
    if (eventsError) {
      console.error('Error deleting events:', eventsError);
    }
    
    // 2. Delete from followed_artists table
    const { error: followedError } = await supabase
      .from('followed_artists')
      .delete()
      .eq('artist_id', artistId);
    
    if (followedError) {
      console.error('Error deleting followed artists:', followedError);
    }
    
    // 3. Finally, delete the artist
    const { error: artistError } = await supabase
      .from('artists')
      .delete()
      .eq('id', artistId);
    
    if (artistError) {
      throw artistError;
    }
    
    // If there were followers, call the API to handle re-following
    if (followers && followers.length > 0) {
      try {
        const response = await fetch(new URL('/api/artists/handle-deleted-followers', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deletedArtistName: artistName,
            followerIds: followers.map((f: { user_id: string }) => f.user_id),
          }),
        });
        
        if (!response.ok) {
          console.warn('Failed to handle deleted followers:', await response.text());
        }
      } catch (fetchError) {
        console.warn('Failed to call handle-deleted-followers API:', fetchError);
      }
    }
    
    // Revalidate the artist management page
    revalidatePath('/admin/artist-management');
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting artist:', error);
    throw error;
  }
}