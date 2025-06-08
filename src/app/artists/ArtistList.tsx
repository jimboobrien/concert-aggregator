'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Artist } from '@/types'

interface ArtistListProps {
  artists: Artist[]
  followedArtistIds: string[]
}

export default function ArtistList({
  artists,
  followedArtistIds,
}: ArtistListProps) {
  const router = useRouter()
  const [followed, setFollowed] = useState<Set<string>>(
    new Set(followedArtistIds)
  )

  const handleFollow = async (artistId: string) => {
    const isFollowing = followed.has(artistId)
    const newFollowed = new Set(followed)

    if (isFollowing) {
      newFollowed.delete(artistId)
    } else {
      newFollowed.add(artistId)
    }
    setFollowed(newFollowed)

    try {
      const response = await fetch(`/api/artists/${artistId}/follow`, {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error('Failed to update follow status')
      }
      // Refresh the page to get the latest data from the server
      router.refresh()
    } catch (error) {
      console.error(error)
      // Revert state on error
      setFollowed(new Set(followed))
    }
  }

  return (
    <ul className="list-group">
      {artists.map((artist) => (
        <li
          key={artist.id}
          className="list-group-item d-flex justify-content-between align-items-center"
        >
          {artist.name}
          <button
            className={`btn ${
              followed.has(artist.id) ? 'btn-secondary' : 'btn-primary'
            }`}
            onClick={() => handleFollow(artist.id)}
          >
            {followed.has(artist.id) ? 'Unfollow' : 'Follow'}
          </button>
        </li>
      ))}
    </ul>
  )
} 