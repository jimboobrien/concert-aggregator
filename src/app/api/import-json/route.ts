import { NextRequest, NextResponse } from 'next/server';
import { DataPersistenceService } from '@/services/data-persistence';
import { createAdminClient } from '@/utils/supabase/admin-client';
import { findOrCreateVenue, recordVenueScrape } from '@/utils/venue-utils';
import { createClient } from '@/utils/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const venueId = formData.get('venueId') as string;
    const followVenue = formData.get('followVenue') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Verify it's a JSON file
    if (!file.name.endsWith('.json')) {
      return NextResponse.json({ error: 'File must be a JSON file' }, { status: 400 });
    }

    // Read the file content
    const fileContent = await file.text();
    let jsonData;
    
    try {
      jsonData = JSON.parse(fileContent);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON file' }, { status: 400 });
    }

    let finalVenueId = venueId;
    let venueName;
    
    // If no venueId is provided or it's 'add-new-venue', try to find or create the venue
    if (!venueId || venueId === 'add-new-venue') {
      // Try to get a URL from the JSON data
      const url = jsonData.url || jsonData.metadata?.sourceURL || '';
      
      if (url) {
        try {
          const venue = await findOrCreateVenue(url);
          finalVenueId = venue.id;
          venueName = venue.name;
          console.log(`Using ${venue.isNew ? 'new' : 'existing'} venue: ${venueName} (${finalVenueId})`);
        } catch (error) {
          console.error('Error finding/creating venue:', error);
          return NextResponse.json({ error: 'Failed to find or create venue' }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: 'No venue ID provided and no URL found in JSON data' }, { status: 400 });
      }
    }
    // If venueId is provided, get the venue name
    else {
      // Get venue name for better filename generation
      const supabase = createAdminClient();
      const { data: venueData } = await supabase
        .from('venues')
        .select('name')
        .eq('id', finalVenueId)
        .single();
      
      venueName = venueData?.name;
    }

    // Initialize the data persistence service
    const dataPersistenceService = new DataPersistenceService();

    // Save the JSON data to Supabase
    const count = await dataPersistenceService.saveJsonToSupabase(
      jsonData,
      finalVenueId,
      true // normalize data
    );

    // Record the import in venue metrics
    if (finalVenueId) {
      try {
        const url = jsonData.url || jsonData.metadata?.sourceURL || 'file-import';
        await recordVenueScrape(finalVenueId, url, count);
      } catch (error) {
        console.error('Error recording venue metrics:', error);
        // Continue even if metrics recording fails
      }
    }

    // Also save to file with the new filename format
    if (jsonData.url) {
      await dataPersistenceService.saveRawJsonToFile(
        jsonData.url,
        jsonData,
        undefined, // Let the system generate the filename
        venueName
      );
    }

    // Follow the venue if requested
    let followResult = null;
    if (followVenue && finalVenueId) {
      try {
        const supabase = createClient();
        
        // Check if already following
        const { data: existingFollow } = await supabase
          .from('followed_venues')
          .select('*')
          .eq('venue_id', finalVenueId)
          .single();
        
        if (!existingFollow) {
          // Follow the venue
          const { error } = await supabase
            .from('followed_venues')
            .insert([{ venue_id: finalVenueId }]);
          
          if (error) {
            console.error('Error following venue:', error);
            followResult = { success: false, message: error.message };
          } else {
            followResult = { success: true, message: `Now following ${venueName || 'venue'}` };
          }
        } else {
          followResult = { success: true, message: `Already following ${venueName || 'venue'}` };
        }
      } catch (error) {
        console.error('Error following venue:', error);
        followResult = { 
          success: false, 
          message: error instanceof Error ? error.message : 'Unknown error following venue' 
        };
      }
    }

    return NextResponse.json({
      success: true,
      count,
      venueId: finalVenueId,
      venueName,
      followResult,
      message: `Successfully imported ${count} events to Supabase`
    });
  } catch (error) {
    console.error('Error importing JSON file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 