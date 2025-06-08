import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const venueId = params.id
  if (!venueId) {
    return NextResponse.json({ error: 'Venue ID is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('followed_venues')
    .insert({ user_id: user.id, venue_id: venueId })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const venueId = params.id
  if (!venueId) {
    return NextResponse.json({ error: 'Venue ID is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('followed_venues')
    .delete()
    .eq('user_id', user.id)
    .eq('venue_id', venueId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
} 