import { createClient } from '@/utils/supabase/server'
import ArtistList from './ArtistList'

export default async function ArtistsPage() {
  const supabase = await createClient()
  const { data: artists, error: artistsError } = await supabase
    .from('artists')
    .select('*')

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let followedArtistIds: string[] = []
  if (user) {
    const { data: followed_artists, error: followedError } = await supabase
      .from('followed_artists')
      .select('artist_id')
      .eq('user_id', user.id)

    if (followedError) {
      console.error('Error fetching followed artists:', followedError)
    } else {
      followedArtistIds = followed_artists.map((a) => a.artist_id)
    }
  }

  if (artistsError) {
    return <div>Error loading artists.</div>
  }

  return (
    <div className="container py-5">
      <h1 className="mb-4">Follow Artists</h1>
      <ArtistList artists={artists || []} followedArtistIds={followedArtistIds} />
    </div>
  )
} 