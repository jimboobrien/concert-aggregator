'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Form, Button, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import { ScrapedData, ConcertEvent } from '@/types';
import { getScrapeData, getVenues, addVenue } from '../actions';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  }, [activeTab]);

  // Handle URL import
  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!url) {
      setError('Please enter a URL.');
      return;
    }

    let venueIdToUse = selectedVenue;

    if (storage === 'supabase' || storage === 'both') {
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
        venueIdToUse = newVenueTyped.id;
        setNewVenueName(''); // Clear the input field after adding
      } else if (!selectedVenue) {
        setError('Please select a venue when saving to Supabase.');
        return;
      }
    }

    setLoading(true);
    setData(null);

    try {
      const storageOptions = {
        saveToJson: storage === 'json' || storage === 'both',
        saveToSupabase: storage === 'supabase' || storage === 'both',
      };

      const result = await getScrapeData(url, storageOptions, venueIdToUse);

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

    if (!selectedFile) {
      setError('Please select a JSON file to import.');
      return;
    }

    if (!selectedFile.name.endsWith('.json')) {
      setError('Selected file must be a JSON file.');
      return;
    }

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
    } else if (!selectedVenue) {
      setError('Please select a venue for this import.');
      return;
    }

    setLoading(true);

    try {
      // Read the file and send it to the server
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('venueId', selectedVenue);

      const response = await fetch('/api/import-json', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to import JSON file');
      }

      setSuccess(`Successfully imported ${result.count} events to Supabase for venue: ${venues.find(v => v.id === selectedVenue)?.name}`);

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
                          <strong>{event.title}</strong><br />
                          <small>Date: {event.date}</small><br />
                          {event.url && <a href={event.url} target="_blank" rel="noopener noreferrer">View Event</a>}
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