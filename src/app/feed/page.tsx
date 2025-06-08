import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { FeedEvent } from '@/types'

export default async function FeedPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const { data: events, error } = await supabase.rpc('get_personalized_feed', {
    p_user_id: user.id,
  })

  if (error) {
    console.error('Error fetching personalized feed:', error)
    return <div>Error loading your feed. Please try again later.</div>
  }

  const feedEvents: FeedEvent[] = events || []

  return (
    <div className="container py-5">
      <h1 className="mb-4">Your Personalized Feed</h1>
      {feedEvents.length === 0 ? (
        <p>
          Your feed is empty. Start following artists and venues to see upcoming
          shows here.
        </p>
      ) : (
        <div className="list-group">
          {feedEvents.map((event) => (
            <a
              key={event.id}
              href={event.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="list-group-item list-group-item-action"
            >
              <div className="d-flex w-100 justify-content-between">
                <h5 className="mb-1">{event.title || event.artist_name}</h5>
                <small>
                  {new Date(event.event_date).toLocaleDateString()}
                </small>
              </div>
              <p className="mb-1">
                <strong>Artist:</strong> {event.artist_name}
                <br />
                <strong>Venue:</strong> {event.venue_name}
              </p>
              <small>{event.description}</small>
            </a>
          ))}
        </div>
      )}
    </div>
  )
} 