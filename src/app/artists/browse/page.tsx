import { createClient } from '@/utils/supabase/server'
import ArtistList from '../ArtistList'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function BrowseArtistsPage() {
  const supabase = await createClient()
  
  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login?redirect=/artists/browse')
  }

  // Get all artists
  const { data: artists, error: artistsError } = await supabase
    .from('artists')
    .select('*')
    .order('name')
    .limit(100) // Limit to prevent loading too many

  if (artistsError) {
    console.error('Error fetching artists:', artistsError)
    return <div className="alert alert-danger">Error loading artists.</div>
  }

  // Get followed artists
  const { data: followedArtistsData, error: followedArtistsError } = await supabase
    .from('followed_artists')
    .select('artist_id')
    .eq('user_id', user.id)

  if (followedArtistsError) {
    console.error('Error fetching followed artists:', followedArtistsError)
    return <div className="alert alert-danger">Error loading your followed artists.</div>
  }

  const followedArtistIds = followedArtistsData.map((a) => a.artist_id)

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Browse Artists</h1>
        <Link href="/artists" className="btn btn-outline-primary">
          Back to My Artists
        </Link>
      </div>
      
      <div className="mb-4">
        <p>
          Follow artists to get updates about their upcoming shows and events.
          Artists you follow will appear on your personalized feed.
        </p>
      </div>
      
      {artists && artists.length > 0 ? (
        <ArtistList artists={artists} followedArtistIds={followedArtistIds} />
      ) : (
        <div className="alert alert-info">
          No artists found. Check back later as our database grows!
        </div>
      )}
    </div>
  )
} 