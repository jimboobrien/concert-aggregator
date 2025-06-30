'use client'

import React, { useState, useEffect } from 'react'
import { getScrapeData, getVenues, followVenue, checkIfFollowingVenue } from './actions'
import { ScrapedData, ConcertEvent } from '@/types'
import Link from 'next/link'
import FollowVenuePrompt from '@/components/FollowVenuePrompt'
import FollowArtistPrompt from '@/components/FollowArtistPrompt'
import { createClient } from '@/utils/supabase/client'
import { trackVenueAppearance } from '@/utils/artist-metrics'

type Venue = { id: string; name: string };

export default function DashboardClientPage() {
  const [url, setUrl] = useState('https://www.thecaverns.com/shows')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ScrapedData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [venues, setVenues] = useState<Venue[]>([])
  const [venueId, setVenueId] = useState<string | null>(null)
  const [showFollowPrompt, setShowFollowPrompt] = useState(false)
  const [forceFreshData, setForceFreshData] = useState(false)
  const [followAfterScrape, setFollowAfterScrape] = useState(false)
  const [artistIds, setArtistIds] = useState<Record<string, string>>({})

  // Fetch venues on component mount
  useEffect(() => {
    const fetchVenues = async () => {
      const venueData = await getVenues();
      setVenues(venueData);
    };
    fetchVenues();
  }, []);

  // Find or create artists based on event titles
  useEffect(() => {
    const findOrCreateArtists = async () => {
      if (!data?.json?.events || data.json.events.length === 0 || !venueId) return;
      
      const supabase = createClient();
      const artistMap: Record<string, string> = {};
      
      // Process each event to find or create artists
      for (const event of data.json.events) {
        if (!event.title) continue;
        
        // Clean up the artist name
        const artistName = event.title.trim();
        
        // Check if this artist already exists
        const { data: existingArtists, error } = await supabase
          .from('artists')
          .select('id, name')
          .ilike('name', artistName)
          .limit(1);
        
        if (error) {
          console.error('Error finding artist:', error);
          continue;
        }
        
        let artistId: string;
        
        if (existingArtists && existingArtists.length > 0) {
          // Artist exists, use their ID
          artistId = existingArtists[0].id;
          artistMap[artistName] = artistId;
        } else {
          // Artist doesn't exist, create them
          const { data: newArtist, error: insertError } = await supabase
            .from('artists')
            .insert({ name: artistName })
            .select()
            .single();
          
          if (insertError) {
            console.error('Error creating artist:', insertError);
            continue;
          }
          
          if (newArtist) {
            artistId = newArtist.id;
            artistMap[artistName] = artistId;
          } else {
            continue;
          }
        }
        
        // Track venue appearance metric
        try {
          await trackVenueAppearance(artistId, venueId);
        } catch (error) {
          console.error('Error tracking venue appearance:', error);
        }
      }
      
      setArtistIds(artistMap);
    };
    
    findOrCreateArtists();
  }, [data, venueId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) {
      setError('Please enter a URL.')
      return
    }
    setLoading(true)
    setData(null)
    setError(null)
    setShowFollowPrompt(false)
    setVenueId(null)
    setArtistIds({})
    
    // Default storage options for quick scrape
    // We set saveToSupabase to false because we don't want to save events to Supabase
    // But we still want to detect and save the venue
    const storageOptions = {
      saveToJson: true,
      saveToSupabase: false,
      detectVenue: true, // This will ensure the venue is detected and saved to Supabase
      useCache: !forceFreshData, // Use cached data unless fresh data is requested
    };
    
    const result = await getScrapeData(url, storageOptions)
    
    if ('error' in result) {
      setError(result.error)
    } else {
      setData(result)
      
      // Check if a venue was automatically detected
      if (result.metadata?.venueId) {
        const detectedVenueId = result.metadata.venueId as string;
        setVenueId(detectedVenueId);
        
        // If follow after scrape is checked, follow the venue automatically
        if (followAfterScrape) {
          try {
            // Check if already following
            const isFollowing = await checkIfFollowingVenue(detectedVenueId);
            
            if (!isFollowing) {
              const followResult = await followVenue(detectedVenueId);
              if (followResult.success) {
                console.log(`Automatically followed venue: ${followResult.message}`);
              } else {
                console.warn(`Failed to follow venue: ${followResult.message}`);
              }
            } else {
              console.log('Already following this venue');
            }
          } catch (error) {
            console.error('Error following venue:', error);
          }
        }
        
        // Show the follow prompt only if we're not auto-following
        setShowFollowPrompt(!followAfterScrape);
      }
      // If not, try to find a matching venue by URL as fallback
      else if (venues.length > 0) {
        // Extract domain from the URL
        try {
          const domain = new URL(url).hostname.replace('www.', '');
          
          // Find a venue that might match the URL
          const matchedVenue = venues.find(venue => {
            // Try to match by name or domain
            const venueName = venue.name.toLowerCase();
            return domain.includes(venueName) || venueName.includes(domain.split('.')[0]);
          });
          
          if (matchedVenue) {
            setVenueId(matchedVenue.id);
            
            // If follow after scrape is checked, follow the venue automatically
            if (followAfterScrape) {
              try {
                // Check if already following
                const isFollowing = await checkIfFollowingVenue(matchedVenue.id);
                
                if (!isFollowing) {
                  const followResult = await followVenue(matchedVenue.id);
                  if (followResult.success) {
                    console.log(`Automatically followed venue: ${followResult.message}`);
                  } else {
                    console.warn(`Failed to follow venue: ${followResult.message}`);
                  }
                } else {
                  console.log('Already following this venue');
                }
              } catch (error) {
                console.error('Error following venue:', error);
              }
            }
            
            // Show the follow prompt only if we're not auto-following
            setShowFollowPrompt(!followAfterScrape);
          }
        } catch (error) {
          console.error('Error matching venue:', error);
        }
      }
    }
    setLoading(false)
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Dashboard</h1>
        <Link href="/dashboard/import" className="btn btn-outline-primary">
          Advanced Import Options
        </Link>
      </div>

      <div className="card mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Quick Scrape</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="mb-0">
            <div className="input-group">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="form-control"
                placeholder="Enter URL to scrape"
                disabled={loading}
              />
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Scraping...' : 'Scrape'}
              </button>
            </div>
            <div className="d-flex mt-2">
              <div className="form-check me-4">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="forceFreshData"
                  checked={forceFreshData}
                  onChange={(e) => setForceFreshData(e.target.checked)}
                  disabled={loading}
                />
                <label className="form-check-label" htmlFor="forceFreshData">
                  Force fresh data (ignore cache)
                </label>
              </div>
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="followAfterScrape"
                  checked={followAfterScrape}
                  onChange={(e) => setFollowAfterScrape(e.target.checked)}
                  disabled={loading}
                />
                <label className="form-check-label" htmlFor="followAfterScrape">
                  Follow venue after scrape
                </label>
              </div>
            </div>
            <div className="form-text mt-2">
              Quick scrape saves to a JSON file. For more options including direct Supabase import, use the Advanced Import Options.
            </div>
          </form>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      
      {/* Follow venue prompt - only show if not auto-following */}
      {showFollowPrompt && venueId && (
        <FollowVenuePrompt 
          venueId={venueId} 
          venueName={venues.find(v => v.id === venueId)?.name || 'Venue'}
        />
      )}

      {data && (
        <div className="card">
          <div className="card-header">
            Scraped Content from <a href={data.url} target="_blank" rel="noopener noreferrer">{data.url}</a>
          </div>
          <div className="card-body">
            <h5 className="card-title">{data.metadata?.title || 'No Title'}</h5>
            <p className="card-text">{data.metadata?.description || 'No Description'}</p>

            {data.json && data.json.events && Array.isArray(data.json.events) && data.json.events.length > 0 ? (
              <div>
                <h6>Extracted Events:</h6>
                <ul className="list-group">
                  {data.json.events.map((event: ConcertEvent, index: number) => (
                    <li key={index} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <strong>{event.title}</strong><br />
                          <small>Date: {event.date}</small><br />
                          {event.url && <a href={event.url} target="_blank" rel="noopener noreferrer" className="me-2">View Event</a>}
                        </div>
                        {event.title && artistIds[event.title] && (
                          <FollowArtistPrompt 
                            artistId={artistIds[event.title]} 
                            artistName={event.title}
                            compact={true}
                          />
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <pre className="bg-light p-3 rounded" style={{ whiteSpace: 'pre-wrap', maxHeight: '400px', overflowY: 'auto' }}>
                {typeof data.markdown === 'string' ? data.markdown : 'No content available'}
              </pre>
            )}
          </div>
          <div className="card-footer text-muted">
            Scraped at: {new Date(data.timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </>
  )
} 