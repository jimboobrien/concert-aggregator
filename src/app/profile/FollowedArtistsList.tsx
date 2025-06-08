'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Artist } from '@/types'

export default function FollowedArtistsList({
  initialArtists,
}: {
  initialArtists: Artist[]
}) {
  const router = useRouter()
  const [artists, setArtists] = useState<Artist[]>(initialArtists)
  const supabase = createClient()

  useEffect(() => {
    setArtists(initialArtists)
  }, [initialArtists])

  const handleUnfollow = async (artistId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('followed_artists')
      .delete()
      .eq('user_id', user.id)
      .eq('artist_id', artistId)

    if (error) {
      console.error('Error unfollowing artist:', error)
    } else {
      setArtists(artists.filter((artist) => artist.id !== artistId))
      router.refresh()
    }
  }

  return (
    <div className="card mt-4">
      <div className="card-body">
        <h2 className="card-title">Followed Artists</h2>
        {artists.length === 0 ? (
          <p>You are not following any artists yet.</p>
        ) : (
          <ul className="list-group">
            {artists.map((artist) => (
              <li
                key={artist.id}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                {artist.name}
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleUnfollow(artist.id)}
                >
                  Unfollow
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
} 