import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { trackArtistSearch } from '@/utils/artist-metrics'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Get search query from URL parameters
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    
    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }
    
    // Search for artists by name
    const { data: artists, error } = await supabase
      .from('artists')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(limit)
    
    if (error) {
      console.error('Error searching artists:', error)
      return NextResponse.json(
        { error: 'Error searching artists' },
        { status: 500 }
      )
    }
    
    // Track search metrics if we have a user and results
    if (user && artists && artists.length > 0) {
      const artistIds = artists.map(artist => artist.id)
      await trackArtistSearch(query, artistIds, true)
    }
    
    return NextResponse.json({ artists })
  } catch (error) {
    console.error('Unexpected error in artist search:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 