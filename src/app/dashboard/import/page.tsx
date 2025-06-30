'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Form, Button, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import { ScrapedData, ConcertEvent } from '@/types';
import { getScrapeData, getVenues, addVenue, followVenue, checkIfFollowingVenue } from '../actions';
import FollowVenuePrompt from '@/components/FollowVenuePrompt';
import FollowArtistPrompt from '@/components/FollowArtistPrompt';
import { createClient } from '@/utils/supabase/client';

type StorageOption = 'json' | 'supabase' | 'both';
type Venue = { id: string; name: string };
type ImportTab = 'url' | 'file';

const ImportPage = () => {
  const [url, setUrl] = useState('');
  const [storage, setStorage] = useState<StorageOption>('json');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ScrapedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<string>('');
  const [newVenueName, setNewVenueName] = useState<string>('');
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ImportTab>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showFollowPrompt, setShowFollowPrompt] = useState(false);
  const [forceFreshData, setForceFreshData] = useState(false);
  const [followAfterScrape, setFollowAfterScrape] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [artistIds, setArtistIds] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchVenues = async () => {
      setVenuesLoading(true);
      const venueData = await getVenues();
      setVenues(venueData);
      if (venueData.length > 0) {
        setSelectedVenue(venueData[0].id);
      } else {
        setSelectedVenue('add-new-venue');
      }
      setVenuesLoading(false);
    };
    fetchVenues();
  }, []);

  // Reset state when changing tabs
  useEffect(() => {
    setError(null);
    setSuccess(null);
    setData(null);
    setShowFollowPrompt(false);
    setArtistIds({});
  }, [activeTab]);

  // Find or create artists based on event titles
  useEffect(() => {
    const findOrCreateArtists = async () => {
      if (!data?.json?.events || data.json.events.length === 0) return;
      
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
        
        if (existingArtists && existingArtists.length > 0) {
          // Artist exists, use their ID
          artistMap[artistName] = existingArtists[0].id;
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
            artistMap[artistName] = newArtist.id;
          }
        }
      }
      
      setArtistIds(artistMap);
    };
    
    findOrCreateArtists();
  }, [data]);

  // Handle URL import
  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setData(null);
    setShowFollowPrompt(false);
    setArtistIds({});
    
    if (!url) {
      setError('Please enter a URL.');
      return;
    }

    let venueIdToUse = selectedVenue;

    // Only need to handle venue creation if explicitly saving to Supabase and using add-new-venue
    if ((storage === 'supabase' || storage === 'both') && selectedVenue === 'add-new-venue') {
      if (!newVenueName.trim()) {
        setError('Please enter a name for the new venue.');
        return;
      }
      setLoading(true);
      const newVenue = await addVenue(newVenueName.trim());
      setLoading(false);

      if ('error' in newVenue) {
        setError(newVenue.error);
        return;
      }
      
      // Add new venue to the list and select it
      const newVenueTyped = newVenue as Venue;
      setVenues(prev => [...prev, newVenueTyped]);
      setSelectedVenue(newVenueTyped.id);
      venueIdToUse = newVenueTyped.id;
      setNewVenueName(''); // Clear the input field after adding
    }

    setLoading(true);
    setData(null);

    try {
      const storageOptions = {
        saveToJson: storage === 'json' || storage === 'both',
        saveToSupabase: storage === 'supabase' || storage === 'both',
        detectVenue: true, // Always detect venue
        useCache: !forceFreshData // Use cached data unless fresh data is requested
      };

      // For JSON-only storage, we'll let the system auto-detect the venue
      // For Supabase storage, we'll use the selected venue if provided
      const useVenueId = storageOptions.saveToSupabase ? venueIdToUse : undefined;
      const useVenueName = storageOptions.saveToSupabase ? venues.find(v => v.id === venueIdToUse)?.name : undefined;

      const result = await getScrapeData(url, storageOptions, useVenueId, useVenueName);

      if ('error' in result) {
        setError(result.error);
      } else {
        setData(result);
        // Create a summary message
        const eventCount = result.json?.events?.length || 0;
        let successMsg = `Successfully scraped ${eventCount} events.`;
        
        if (storage === 'json' || storage === 'both') {
          successMsg += ' Events saved to JSON file.';
        }
        
        if (storage === 'supabase' || storage === 'both') {
          successMsg += ' Events saved to Supabase database.';
        }
        
        setSuccess(successMsg);
        
        // Check if a venue was automatically detected
        if (result.metadata?.venueId) {
          const detectedVenueId = result.metadata.venueId as string;
          
          // If the venue was auto-detected and we don't already have it in our list, fetch venues again
          if (!venues.some(v => v.id === detectedVenueId)) {
            const venueData = await getVenues();
            setVenues(venueData);
          }
          
          setSelectedVenue(detectedVenueId);
          
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
        // Show follow prompt if venue was selected and saved to Supabase
        else if (venueIdToUse && venueIdToUse !== 'add-new-venue' && (storage === 'supabase' || storage === 'both')) {
          // If follow after scrape is checked, follow the venue automatically
          if (followAfterScrape) {
            try {
              // Check if already following
              const isFollowing = await checkIfFollowingVenue(venueIdToUse);
              
              if (!isFollowing) {
                const followResult = await followVenue(venueIdToUse);
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
      }
    } catch (err) {
      console.error('Error during import:', err);
      setError(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setError(null);
      setSuccess(null);
    }
  };

  const handleFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setData(null);
    setShowFollowPrompt(false);
    setArtistIds({});

    if (!selectedFile) {
      setError('Please select a JSON file to import.');
      return;
    }

    if (!selectedFile.name.endsWith('.json')) {
      setError('Selected file must be a JSON file.');
      return;
    }

    // Only need to handle venue creation if explicitly adding a new venue
    if (selectedVenue === 'add-new-venue') {
      if (!newVenueName.trim()) {
        setError('Please enter a name for the new venue.');
        return;
      }
      setLoading(true);
      const newVenue = await addVenue(newVenueName.trim());
      setLoading(false);

      if ('error' in newVenue) {
        setError(newVenue.error);
        return;
      }
      
      // Add new venue to the list and select it
      const newVenueTyped = newVenue as Venue;
      setVenues(prev => [...prev, newVenueTyped]);
      setSelectedVenue(newVenueTyped.id);
      setNewVenueName('');
    }

    setLoading(true);

    try {
      // Read the file and send it to the server
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('venueId', selectedVenue);
      formData.append('followVenue', followAfterScrape.toString());

      const response = await fetch('/api/import-json', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to import JSON file');
      }

      // If the API returned a venueId (it might have auto-detected one), use that
      if (result.venueId) {
        // If the venue was auto-detected and we don't already have it in our list, fetch venues again
        if (!venues.some(v => v.id === result.venueId)) {
          const venueData = await getVenues();
          setVenues(venueData);
        }
        
        setSelectedVenue(result.venueId);
        
        // If follow after scrape is checked, follow the venue automatically
        if (followAfterScrape) {
          try {
            // Check if already following
            const isFollowing = await checkIfFollowingVenue(result.venueId);
            
            if (!isFollowing) {
              const followResult = await followVenue(result.venueId);
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
      }

      setSuccess(`Successfully imported ${result.count} events to Supabase for venue: ${result.venueName || venues.find(v => v.id === selectedVenue)?.name}`);
      
      // Show follow prompt only if we're not auto-following
      setShowFollowPrompt(!followAfterScrape);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSelectedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderVenueSelector = () => {
    if ((activeTab === 'url' && storage !== 'supabase') || venuesLoading) {
      if (venuesLoading) {
        return (
          <div className="text-center py-3">
            <Spinner animation="border" size="sm" />
            <span className="ms-2">Loading venues...</span>
          </div>
        );
      }
      return null;
    }

    return (
      <div key="venue-selection">
        <Form.Group className="mb-3" controlId="formVenue">
          <Form.Label>Select Venue</Form.Label>
          <Form.Control
            as="select"
            value={selectedVenue}
            onChange={(e) => setSelectedVenue(e.target.value)}
            disabled={loading}
          >
            {venues.length > 0 ? (
              venues.map(venue => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))
            ) : (
              <option value="" disabled>No venues available</option>
            )}
            <option value="add-new-venue">-- Add New Venue --</option>
          </Form.Control>
        </Form.Group>

        {selectedVenue === 'add-new-venue' && (
          <Form.Group className="mb-3" controlId="newVenueName">
            <Form.Label>New Venue Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter the name of the new venue"
              value={newVenueName}
              onChange={(e) => setNewVenueName(e.target.value)}
              disabled={loading}
            />
            {venues.length === 0 && (
              <Form.Text className="text-info">
                No venues exist in the database. Please create a new one.
              </Form.Text>
            )}
          </Form.Group>
        )}
      </div>
    );
  }

  return (
    <Container fluid>
      <Row>
        <Col>
          <h1>Import Data</h1>
          <p>Import concert data from URLs or JSON files.</p>

          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k as ImportTab)}
            className="mb-3"
          >
            <Tab eventKey="url" title="Import from URL">
              <Form onSubmit={handleUrlSubmit}>
                <Form.Group className="mb-3" controlId="formUrl">
                  <Form.Label>Website URL</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={loading}
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formStorage">
                  <Form.Label>Storage Option</Form.Label>
                  <Form.Control
                    as="select"
                    value={storage}
                    onChange={(e) => setStorage(e.target.value as StorageOption)}
                    disabled={loading}
                  >
                    <option value="json">Save to JSON file</option>
                    <option value="supabase">Save to Supabase</option>
                    <option value="both">Save to both</option>
                  </Form.Control>
                </Form.Group>

                <div className="d-flex mb-3">
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

                {renderVenueSelector()}

                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" />
                      <span className="ms-2">Scraping...</span>
                    </>
                  ) : (
                    'Scrape'
                  )}
                </Button>
              </Form>
            </Tab>
            
            <Tab eventKey="file" title="Import from File">
              <Form onSubmit={handleFileSubmit}>
                <Form.Group className="mb-3" controlId="formFile">
                  <Form.Label>JSON File</Form.Label>
                  <Form.Control
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    disabled={loading}
                    ref={fileInputRef}
                  />
                  <Form.Text className="text-muted">
                    Select a JSON file containing concert data to import directly to Supabase.
                  </Form.Text>
                </Form.Group>

                {renderVenueSelector()}

                <div className="form-check mb-3">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="followAfterFileImport"
                    checked={followAfterScrape}
                    onChange={(e) => setFollowAfterScrape(e.target.checked)}
                    disabled={loading}
                  />
                  <label className="form-check-label" htmlFor="followAfterFileImport">
                    Follow venue after import
                  </label>
                </div>

                <Button variant="primary" type="submit" disabled={loading || !selectedFile}>
                  {loading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" />
                      <span className="ms-2">Importing...</span>
                    </>
                  ) : (
                    'Import to Supabase'
                  )}
                </Button>
              </Form>
              
              <div className="mt-4">
                <h5>Supported File Formats:</h5>
                <ul>
                  <li>Standard format with JSON structure containing events array</li>
                  <li>Simple array of events with title, date, and URL fields</li>
                  <li>Object with events array property</li>
                </ul>
                <p className="text-muted">Files will be normalized before importing to ensure data consistency.</p>
              </div>
            </Tab>
          </Tabs>

          {error && <Alert variant="danger" className="mt-4">{error}</Alert>}
          {success && <Alert variant="success" className="mt-4">{success}</Alert>}

          {/* Follow venue prompt - only show if not auto-following */}
          {showFollowPrompt && selectedVenue && selectedVenue !== 'add-new-venue' && (
            <FollowVenuePrompt 
              venueId={selectedVenue} 
              venueName={venues.find(v => v.id === selectedVenue)?.name}
            />
          )}

          {data && (
            <div className="card mt-4">
              <div className="card-header">
                Scraped Content from <a href={data.url} target="_blank" rel="noopener noreferrer">{data.url}</a>
              </div>
              <div className="card-body">
                <h5 className="card-title">{data.metadata?.title || 'No Title'}</h5>
                <p className="card-text">{data.metadata?.description || 'No Description'}</p>
                 {data.json && data.json.events && data.json.events.length > 0 ? (
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
                    {data.markdown}
                  </pre>
                )}
              </div>
              <div className="card-footer text-muted">
                Scraped at: {new Date(data.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ImportPage; 