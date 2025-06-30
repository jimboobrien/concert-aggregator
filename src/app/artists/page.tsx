import { createClient } from '@/utils/supabase/server'
import ArtistList from './ArtistList'
import { getArtistRecommendations } from '@/utils/supabase/functions/artist-recommendations'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ArtistsPage() {
  const supabase = await createClient()
  
  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login?redirect=/artists')
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
  
  // Get the full artist details for followed artists
  const { data: followedArtists, error: artistsError } = await supabase
    .from('artists')
    .select('*')
    .in('id', followedArtistIds.length > 0 ? followedArtistIds : ['00000000-0000-0000-0000-000000000000'])

  if (artistsError) {
    console.error('Error fetching artist details:', artistsError)
    return <div className="alert alert-danger">Error loading artist details.</div>
  }

  // Get artist recommendations
  const allRecommendations = await getArtistRecommendations(user.id, 10)
  
  // Double-check to make sure we're not showing any followed artists in recommendations
  const recommendations = allRecommendations.filter(
    artist => !followedArtistIds.includes(artist.id)
  ).slice(0, 5)

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>My Artists</h1>
        <Link href="/artists/browse" className="btn btn-outline-primary">
          Browse All Artists
        </Link>
      </div>
      
      {followedArtists && followedArtists.length > 0 ? (
        <>
          <h2 className="h4 mb-3">Artists You Follow</h2>
          <ArtistList artists={followedArtists} followedArtistIds={followedArtistIds} />
        </>
      ) : (
        <div className="alert alert-info">
          You&apos;re not following any artists yet. Check out the recommendations below!
        </div>
      )}

      <h2 className="h4 mt-5 mb-3">Recommended Artists</h2>
      {recommendations.length > 0 ? (
        <ArtistList artists={recommendations} followedArtistIds={followedArtistIds} />
      ) : (
        <div className="alert alert-info">
          No recommendations available at this time. Try following some venues or artists!
        </div>
      )}

      <div className="mt-5">
        <h2 className="h4 mb-3">How Recommendations Work</h2>
        <div className="card">
          <div className="card-body">
            <p className="card-text">
              Our recommendation system suggests new artists based on:
            </p>
            <ul className="mb-0">
              <li>Artists who perform at venues you follow</li>
              <li>Artists similar to ones you already follow</li>
              <li>Popular artists in your area</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 