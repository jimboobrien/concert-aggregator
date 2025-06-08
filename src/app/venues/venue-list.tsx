'use client'

import { useState } from 'react'
import { type Venue } from '@/types' // Assuming you have a types file

export default function VenueList({
  initialVenues,
  initialFollowedVenueIds,
}: {
  initialVenues: Venue[]
  initialFollowedVenueIds: Set<string>
}) {
  const [venues] = useState(initialVenues)
  const [followedVenueIds, setFollowedVenueIds] = useState(initialFollowedVenueIds)
  const [loading, setLoading] = useState<string | null>(null)

  const handleFollow = async (venueId: string) => {
    setLoading(venueId)
    try {
      const response = await fetch(`/api/venues/${venueId}/follow`, {
        method: 'POST',
      })
      if (response.ok) {
        setFollowedVenueIds(prev => new Set(prev).add(venueId))
      } else {
        console.error('Failed to follow venue')
      }
    } catch (error) {
      console.error('An error occurred:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleUnfollow = async (venueId: string) => {
    setLoading(venueId)
    try {
      const response = await fetch(`/api/venues/${venueId}/follow`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setFollowedVenueIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(venueId)
          return newSet
        })
      } else {
        console.error('Failed to unfollow venue')
      }
    } catch (error) {
      console.error('An error occurred:', error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="list-group mt-3">
      {venues.map(venue => (
        <div key={venue.id} className="list-group-item d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-1">{venue.name}</h5>
            <p className="mb-1 text-muted">{`${venue.city}, ${venue.state}`}</p>
          </div>
          {followedVenueIds.has(venue.id) ? (
            <button
              className="btn btn-secondary"
              onClick={() => handleUnfollow(venue.id)}
              disabled={loading === venue.id}
            >
              {loading === venue.id ? '...' : 'Unfollow'}
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => handleFollow(venue.id)}
              disabled={loading === venue.id}
            >
              {loading === venue.id ? '...' : 'Follow'}
            </button>
          )}
        </div>
      ))}
    </div>
  )
} 