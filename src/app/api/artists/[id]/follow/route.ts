import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Properly access the ID parameter
    const artistId = params.id

    // Check if the user is following the artist
    const { data, error } = await supabase
      .from('followed_artists')
      .select('*')
      .eq('user_id', user.id)
      .eq('artist_id', artistId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is fine.
      console.error('Error checking follow status:', error)
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
    }

    return NextResponse.json({ isFollowing: !!data })
  } catch (error) {
    console.error('Unexpected error in artist follow status handler:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

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

    // Properly access the ID parameter
    const artistId = params.id

    // Check if the artist exists
    const { error: artistError } = await supabase
      .from('artists')
      .select('id')
      .eq('id', artistId)
      .single()

    if (artistError) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 })
    }

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
      return NextResponse.json({ 
        message: 'You are already following this artist',
        isFollowing: true
      })
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
      return NextResponse.json({ 
        message: 'Followed successfully',
        isFollowing: true
      })
    }
  } catch (error) {
    console.error('Unexpected error in artist follow handler:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Properly access the ID parameter
    const artistId = params.id

    // Delete the follow relationship
    const { error } = await supabase
      .from('followed_artists')
      .delete()
      .eq('user_id', user.id)
      .eq('artist_id', artistId)

    if (error) {
      console.error('Error unfollowing artist:', error)
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Unfollowed successfully',
      isFollowing: false
    })
  } catch (error) {
    console.error('Unexpected error in artist unfollow handler:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 