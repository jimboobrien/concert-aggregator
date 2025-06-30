import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { callOpenRouter } from '@/utils/openrouter-client';

export async function POST(request: Request) {
  const { deletedArtistName, followerIds } = await request.json();

  if (!deletedArtistName || !followerIds || !Array.isArray(followerIds)) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    // 1. Use AI to find a canonical name for the artist
    const canonicalName = await callOpenRouter(
      `What is the most common or canonical name for the artist "${deletedArtistName}"? Consider variations like removing "The" from the beginning or other common simplifications.`,
      {
        systemPrompt: 'You are an expert in music and artist names. Your task is to find the most common or canonical name for a given artist. Respond with only the name.',
        model: 'mistralai/mistral-7b-instruct:free',
      }
    );

    if (!canonicalName) {
      return NextResponse.json({ error: 'AI failed to determine a canonical name' }, { status: 500 });
    }

    // 2. Search for the canonical artist in our database
    const supabase = await createClient();
    const { data: replacementArtist, error: searchError } = await supabase
      .from('artists')
      .select('id')
      .ilike('name', `%${canonicalName}%`)
      .limit(1)
      .single();

    if (searchError || !replacementArtist) {
      return NextResponse.json({ message: 'No suitable replacement artist found.' });
    }

    // 3. Re-assign followers to the new artist
    const newFollows = followerIds.map((userId: string) => ({
      user_id: userId,
      artist_id: replacementArtist.id,
    }));

    const { error: insertError } = await supabase
      .from('followed_artists')
      .insert(newFollows);

    if (insertError) {
      console.error('Error re-assigning followers:', insertError);
      return NextResponse.json({ error: 'Failed to re-assign followers' }, { status: 500 });
    }

    return NextResponse.json({
      message: `Successfully re-assigned ${followerIds.length} followers to ${canonicalName}.`,
    });

  } catch (error) {
    console.error('Error in handle-deleted-followers:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
} 