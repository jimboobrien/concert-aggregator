import { NextRequest, NextResponse } from 'next/server';
import { DataPersistenceService } from '@/services/data-persistence';
import { createAdminClient } from '@/utils/supabase/admin-client';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const venueId = formData.get('venueId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!venueId) {
      return NextResponse.json({ error: 'No venue ID provided' }, { status: 400 });
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

    // Get venue name for better filename generation
    const supabase = createAdminClient();
    const { data: venueData } = await supabase
      .from('venues')
      .select('name')
      .eq('id', venueId)
      .single();
    
    const venueName = venueData?.name;

    // Initialize the data persistence service
    const dataPersistenceService = new DataPersistenceService();

    // Save the JSON data to Supabase
    const count = await dataPersistenceService.saveJsonToSupabase(
      jsonData,
      venueId,
      true // normalize data
    );

    // Also save to file with the new filename format
    if (jsonData.url) {
      await dataPersistenceService.saveRawJsonToFile(
        jsonData.url,
        jsonData,
        undefined, // Let the system generate the filename
        venueName
      );
    }

    return NextResponse.json({
      success: true,
      count,
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