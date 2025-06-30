'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Artist } from '@/types/index'
import { trackArtistView } from '@/utils/artist-metrics'

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
  
  // Function to handle viewing an artist's details
  const handleViewArtist = async (artistId: string) => {
    // Track the view metric
    await trackArtistView(artistId, 'artist_list');
    
    // In the future, this would navigate to the artist's page
    // router.push(`/artists/${artistId}`);
    
    // For now, just log that we would navigate
    console.log(`Would navigate to artist page for: ${artistId}`);
  }

  return (
    <ul className="list-group">
      {artists.map((artist) => (
        <li
          key={artist.id}
          className="list-group-item d-flex justify-content-between align-items-center"
        >
          <div 
            className="artist-name cursor-pointer" 
            onClick={() => handleViewArtist(artist.id)}
            style={{ cursor: 'pointer' }}
          >
            {artist.name}
          </div>
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