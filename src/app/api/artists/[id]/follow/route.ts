import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const artistId = params.id

    // Check if the user is already following the artist
    const { data: existingFollow, error: selectError } = await supabase
      .from('followed_artists')
      .select('*')
      .eq('user_id', user.id)
      .eq('artist_id', artistId)
      .single()

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is fine.
      console.error('Error checking follow status:', selectError)
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
    }

    if (existingFollow) {
      // User is already following, so unfollow
      const { error: deleteError } = await supabase
        .from('followed_artists')
        .delete()
        .eq('user_id', user.id)
        .eq('artist_id', artistId)

      if (deleteError) {
        console.error('Error unfollowing artist:', deleteError)
        return NextResponse.json(
          { error: 'Internal Server Error' },
          { status: 500 }
        )
      }
      return NextResponse.json({ message: 'Unfollowed successfully' })
    } else {
      // User is not following, so follow
      const { error: insertError } = await supabase
        .from('followed_artists')
        .insert({ user_id: user.id, artist_id: artistId })

      if (insertError) {
        console.error('Error following artist:', insertError)
        return NextResponse.json(
          { error: 'Internal Server Error' },
          { status: 500 }
        )
      }
      return NextResponse.json({ message: 'Followed successfully' })
    }
  } catch (error) {
    console.error('Unexpected error in artist follow handler:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 