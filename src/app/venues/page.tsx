import { createClient } from '@/utils/supabase/server'
import VenueList from './venue-list'

export default async function VenuesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: venues, error: venuesError } = await supabase
    .from('venues')
    .select('*')
    .order('name')

  const { data: followedVenues, error: followedVenuesError } = await supabase
    .from('followed_venues')
    .select('venue_id')
    .eq('user_id', user?.id)

  if (venuesError || followedVenuesError) {
    console.error('Error fetching venues:', venuesError || followedVenuesError)
    // You might want to render an error state here
    return <p>Error loading venues. Please try again later.</p>
  }

  const followedVenueIds = new Set(followedVenues?.map(v => v.venue_id) || [])

  return (
    <div className="container mt-5">
      <h1>Venues</h1>
      <p>Follow your favorite venues to get updates on their upcoming shows.</p>
      <VenueList initialVenues={venues || []} initialFollowedVenueIds={followedVenueIds} />
    </div>
  )
} 