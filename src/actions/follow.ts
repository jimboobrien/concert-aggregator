'use server';

/**
 * Server Actions for Following Artists and Venues
 * 
 * This file centralizes all follow-related server actions for the application.
 * These actions handle following and unfollowing artists and venues, and checking follow status.
 */

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Validates a UUID string
 * @param id The ID to validate
 * @returns True if the ID is a valid UUID, false otherwise
 */
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Follow an artist
 * @param artistId The ID of the artist to follow
 * @returns Result object with success status and message
 */
export async function followArtist(artistId: string): Promise<{ success: boolean; message: string; isFollowing: boolean }> {
  // Basic validation
  if (!artistId) {
    return { 
      success: false, 
      message: 'Artist ID is required', 
      isFollowing: false 
    };
  }

  // Trim the input
  const trimmedArtistId = artistId.trim();

  // Validate UUID format
  if (!isValidUUID(trimmedArtistId)) {
    return {
      success: false,
      message: 'Invalid artist ID format',
      isFollowing: false
    };
  }

  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { 
        success: false, 
        message: 'You must be logged in to follow artists.', 
        isFollowing: false 
      };
    }

    // Check if the artist exists
    const { error: artistError } = await supabase
      .from('artists')
      .select('id')
      .eq('id', trimmedArtistId)
      .single();

    if (artistError) {
      return { 
        success: false, 
        message: 'Artist not found', 
        isFollowing: false 
      };
    }

    // Check if already following
    const { data: existingFollow, error: checkError } = await supabase
      .from('followed_artists')
      .select('*')
      .eq('user_id', user.id)
      .eq('artist_id', trimmedArtistId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is expected if not following
      console.error('Error checking follow status:', checkError);
      return { 
        success: false, 
        message: 'Failed to check follow status', 
        isFollowing: false 
      };
    }

    if (existingFollow) {
      return { 
        success: true, 
        message: 'You are already following this artist', 
        isFollowing: true 
      };
    }

    // Insert the follow relationship
    const { error: insertError } = await supabase
      .from('followed_artists')
      .insert({ user_id: user.id, artist_id: trimmedArtistId });

    if (insertError) {
      console.error('Error following artist:', insertError);
      
      // Handle foreign key constraint violations
      if (insertError.code === '23503') {
        return {
          success: false,
          message: 'Cannot follow this artist. The artist may have been deleted.',
          isFollowing: false
        };
      }
      
      return { 
        success: false, 
        message: `Failed to follow artist: ${insertError.message}`, 
        isFollowing: false 
      };
    }

    // Revalidate relevant paths
    revalidatePath('/profile');
    revalidatePath('/feed');

    return { 
      success: true, 
      message: 'Artist followed successfully!', 
      isFollowing: true 
    };
  } catch (error) {
    console.error('Unexpected error in followArtist:', error);
    return { 
      success: false, 
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`, 
      isFollowing: false 
    };
  }
}

/**
 * Unfollow an artist
 * @param artistId The ID of the artist to unfollow
 * @returns Result object with success status and message
 */
export async function unfollowArtist(artistId: string): Promise<{ success: boolean; message: string; isFollowing: boolean }> {
  // Basic validation
  if (!artistId) {
    return { 
      success: false, 
      message: 'Artist ID is required', 
      isFollowing: true 
    };
  }

  // Trim the input
  const trimmedArtistId = artistId.trim();

  // Validate UUID format
  if (!isValidUUID(trimmedArtistId)) {
    return {
      success: false,
      message: 'Invalid artist ID format',
      isFollowing: true
    };
  }

  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { 
        success: false, 
        message: 'You must be logged in to unfollow artists.', 
        isFollowing: true 
      };
    }

    // Check if actually following before attempting to unfollow
    const { data: existingFollow, error: checkError } = await supabase
      .from('followed_artists')
      .select('*')
      .eq('user_id', user.id)
      .eq('artist_id', trimmedArtistId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking follow status:', checkError);
      return { 
        success: false, 
        message: 'Failed to check follow status', 
        isFollowing: true 
      };
    }

    // If not following, return early with a success message
    if (!existingFollow) {
      return { 
        success: true, 
        message: 'You are not following this artist', 
        isFollowing: false 
      };
    }

    // Delete the follow relationship
    const { error } = await supabase
      .from('followed_artists')
      .delete()
      .eq('user_id', user.id)
      .eq('artist_id', trimmedArtistId);

    if (error) {
      console.error('Error unfollowing artist:', error);
      return { 
        success: false, 
        message: `Failed to unfollow artist: ${error.message}`, 
        isFollowing: true 
      };
    }

    // Revalidate relevant paths
    revalidatePath('/profile');
    revalidatePath('/feed');

    return { 
      success: true, 
      message: 'Artist unfollowed successfully!', 
      isFollowing: false 
    };
  } catch (error) {
    console.error('Unexpected error in unfollowArtist:', error);
    return { 
      success: false, 
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`, 
      isFollowing: true 
    };
  }
}

/**
 * Check if the current user is following an artist
 * @param artistId The ID of the artist to check
 * @returns Boolean indicating if the user is following the artist
 */
export async function isFollowingArtist(artistId: string): Promise<boolean> {
  if (!artistId || !isValidUUID(artistId.trim())) {
    return false;
  }

  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return false;
    }

    // Check if already following
    const { data, error } = await supabase
      .from('followed_artists')
      .select('*')
      .eq('user_id', user.id)
      .eq('artist_id', artistId.trim())
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is expected if not following
      console.error('Error checking artist follow status:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Unexpected error in isFollowingArtist:', error);
    return false;
  }
}

/**
 * Follow a venue
 * @param venueId The ID of the venue to follow
 * @returns Result object with success status and message
 */
export async function followVenue(venueId: string): Promise<{ success: boolean; message: string; isFollowing: boolean }> {
  // Basic validation
  if (!venueId) {
    return { 
      success: false, 
      message: 'Venue ID is required', 
      isFollowing: false 
    };
  }

  // Trim the input
  const trimmedVenueId = venueId.trim();

  // Validate UUID format
  if (!isValidUUID(trimmedVenueId)) {
    return {
      success: false,
      message: 'Invalid venue ID format',
      isFollowing: false
    };
  }

  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { 
        success: false, 
        message: 'You must be logged in to follow venues.', 
        isFollowing: false 
      };
    }

    // Check if the venue exists
    const { error: venueError } = await supabase
      .from('venues')
      .select('id')
      .eq('id', trimmedVenueId)
      .single();

    if (venueError) {
      return { 
        success: false, 
        message: 'Venue not found', 
        isFollowing: false 
      };
    }

    // Check if already following
    const { data: existingFollow, error: checkError } = await supabase
      .from('followed_venues')
      .select('*')
      .eq('user_id', user.id)
      .eq('venue_id', trimmedVenueId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is expected if not following
      console.error('Error checking follow status:', checkError);
      return { 
        success: false, 
        message: 'Failed to check follow status', 
        isFollowing: false 
      };
    }

    if (existingFollow) {
      return { 
        success: true, 
        message: 'You are already following this venue', 
        isFollowing: true 
      };
    }

    // Insert the follow relationship
    const { error: insertError } = await supabase
      .from('followed_venues')
      .insert({ user_id: user.id, venue_id: trimmedVenueId });

    if (insertError) {
      console.error('Error following venue:', insertError);
      
      // Handle foreign key constraint violations
      if (insertError.code === '23503') {
        return {
          success: false,
          message: 'Cannot follow this venue. The venue may have been deleted.',
          isFollowing: false
        };
      }
      
      return { 
        success: false, 
        message: `Failed to follow venue: ${insertError.message}`, 
        isFollowing: false 
      };
    }

    // Revalidate relevant paths
    revalidatePath('/profile');
    revalidatePath('/feed');

    return { 
      success: true, 
      message: 'Venue followed successfully!', 
      isFollowing: true 
    };
  } catch (error) {
    console.error('Unexpected error in followVenue:', error);
    return { 
      success: false, 
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`, 
      isFollowing: false 
    };
  }
}

/**
 * Unfollow a venue
 * @param venueId The ID of the venue to unfollow
 * @returns Result object with success status and message
 */
export async function unfollowVenue(venueId: string): Promise<{ success: boolean; message: string; isFollowing: boolean }> {
  // Basic validation
  if (!venueId) {
    return { 
      success: false, 
      message: 'Venue ID is required', 
      isFollowing: true 
    };
  }

  // Trim the input
  const trimmedVenueId = venueId.trim();

  // Validate UUID format
  if (!isValidUUID(trimmedVenueId)) {
    return {
      success: false,
      message: 'Invalid venue ID format',
      isFollowing: true
    };
  }

  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { 
        success: false, 
        message: 'You must be logged in to unfollow venues.', 
        isFollowing: true 
      };
    }

    // Check if actually following before attempting to unfollow
    const { data: existingFollow, error: checkError } = await supabase
      .from('followed_venues')
      .select('*')
      .eq('user_id', user.id)
      .eq('venue_id', trimmedVenueId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking follow status:', checkError);
      return { 
        success: false, 
        message: 'Failed to check follow status', 
        isFollowing: true 
      };
    }

    // If not following, return early with a success message
    if (!existingFollow) {
      return { 
        success: true, 
        message: 'You are not following this venue', 
        isFollowing: false 
      };
    }

    // Delete the follow relationship
    const { error } = await supabase
      .from('followed_venues')
      .delete()
      .eq('user_id', user.id)
      .eq('venue_id', trimmedVenueId);

    if (error) {
      console.error('Error unfollowing venue:', error);
      return { 
        success: false, 
        message: `Failed to unfollow venue: ${error.message}`, 
        isFollowing: true 
      };
    }

    // Revalidate relevant paths
    revalidatePath('/profile');
    revalidatePath('/feed');

    return { 
      success: true, 
      message: 'Venue unfollowed successfully!', 
      isFollowing: false 
    };
  } catch (error) {
    console.error('Unexpected error in unfollowVenue:', error);
    return { 
      success: false, 
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`, 
      isFollowing: true 
    };
  }
}

/**
 * Check if the current user is following a venue
 * @param venueId The ID of the venue to check
 * @returns Boolean indicating if the user is following the venue
 */
export async function isFollowingVenue(venueId: string): Promise<boolean> {
  if (!venueId || !isValidUUID(venueId.trim())) {
    return false;
  }

  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return false;
    }

    // Check if already following
    const { data, error } = await supabase
      .from('followed_venues')
      .select('*')
      .eq('user_id', user.id)
      .eq('venue_id', venueId.trim())
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is expected if not following
      console.error('Error checking venue follow status:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Unexpected error in isFollowingVenue:', error);
    return false;
  }
} 