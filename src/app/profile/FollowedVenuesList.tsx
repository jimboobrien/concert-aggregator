'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Venue } from '@/types'

export default function FollowedVenuesList({
  initialVenues,
}: {
  initialVenues: Venue[]
}) {
  const router = useRouter()
  const [venues, setVenues] = useState<Venue[]>(initialVenues)
  const supabase = createClient()

  useEffect(() => {
    setVenues(initialVenues)
  }, [initialVenues])

  const handleUnfollow = async (venueId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('followed_venues')
      .delete()
      .eq('user_id', user.id)
      .eq('venue_id', venueId)

    if (error) {
      console.error('Error unfollowing venue:', error)
    } else {
      setVenues(venues.filter((venue) => venue.id !== venueId))
      router.refresh()
    }
  }

  return (
    <div className="card mt-4">
      <div className="card-body">
        <h2 className="card-title">Followed Venues</h2>
        {venues.length === 0 ? (
          <p>You are not following any venues yet.</p>
        ) : (
          <ul className="list-group">
            {venues.map((venue) => (
              <li
                key={venue.id}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                {venue.name}
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleUnfollow(venue.id)}
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