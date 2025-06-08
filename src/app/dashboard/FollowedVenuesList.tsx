import { createClient } from '@/utils/supabase/server'
import { Venue } from '@/types'

export default async function FollowedVenuesList() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>You need to be logged in to see your followed venues.</div>
  }

  const { data: followed_venues, error } = await supabase
    .from('followed_venues')
    .select('venues (*)')
    .eq('user_id', user.id)

  if (error) {
    console.error('Error fetching followed venues:', error)
    return <div>Error loading venues.</div>
  }

  const venues: Venue[] =
    followed_venues?.map((v: { venues: Venue }) => v.venues) || []

  return (
    <div>
      <h2>Your Followed Venues</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Location</th>
            <th>Website</th>
          </tr>
        </thead>
        <tbody>
          {venues.map((venue: Venue) => (
            <tr key={venue.id}>
              <td>{venue.name}</td>
              <td>
                {venue.city}, {venue.state}
              </td>
              <td>
                <a href={venue.url || '#'} target="_blank" rel="noopener noreferrer">
                  {venue.url}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
} 