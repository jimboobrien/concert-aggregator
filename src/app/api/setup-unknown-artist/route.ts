import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin-client';

const UNKNOWN_ARTIST_ID = 'c0a80121-7ac6-4745-b000-f95544c77ed2';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Check if the artist already exists
    const { data: existingArtist, error: checkError } = await supabase
      .from('artists')
      .select('id')
      .eq('id', UNKNOWN_ARTIST_ID)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      return NextResponse.json({
        success: false,
        error: `Error checking for artist: ${checkError.message}`
      }, { status: 500 });
    }

    // If the artist already exists, return success
    if (existingArtist) {
      return NextResponse.json({
        success: true,
        message: 'Unknown Artist already exists',
        id: UNKNOWN_ARTIST_ID
      });
    }

    // Create the artist with the specific ID
    const { data, error } = await supabase
      .from('artists')
      .insert({
        id: UNKNOWN_ARTIST_ID,
        name: 'Unknown Artist'
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: `Failed to create Unknown Artist: ${error.message}`
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Unknown Artist created successfully',
      data
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      error: `Unexpected error: ${errorMessage}`
    }, { status: 500 });
  }
} 