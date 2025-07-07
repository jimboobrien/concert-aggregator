import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from './profile-form'
import FollowedArtistsList from './FollowedArtistsList'
import FollowedVenuesList from './FollowedVenuesList'
import { Artist, Venue } from '@/types'

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // Check if user is admin
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  
  const isAdmin = userRole?.role === 'admin'

  const { data: followed_artists, error: artistsError } = await supabase
    .from('followed_artists')
    .select('artists (*)')
    .eq('user_id', user.id)

  const { data: followed_venues, error: venuesError } = await supabase
    .from('followed_venues')
    .select('venues (*)')
    .eq('user_id', user.id)

  if (artistsError) console.error('Error fetching followed artists:', artistsError)
  if (venuesError) console.error('Error fetching followed venues:', venuesError)

  const artists: Artist[] =
    followed_artists?.map((a: { artists: Artist }) => a.artists) || []
  const venues: Venue[] =
    followed_venues?.map((v: { venues: Venue }) => v.venues) || []

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card mt-5">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <h1 className="card-title mb-0">User Profile</h1>
                {isAdmin && (
                  <span className="badge bg-danger fs-6">
                    <i className="bi bi-shield-check me-1"></i>
                    Administrator
                  </span>
                )}
              </div>
              <p className="mt-3">This is your public profile page. You can share this with others.</p>
            </div>
          </div>
          <ProfileForm user={user} />
          <FollowedArtistsList initialArtists={artists} />
          <FollowedVenuesList initialVenues={venues} />
        </div>
      </div>
    </div>
  )
} 