'use client';

import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Form, InputGroup, Modal, Alert, Spinner } from 'react-bootstrap';
import { createClient } from '@/utils/supabase/client';
import { deleteVenueAction } from './actions';

interface Venue {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  country: string | null;
  url: string | null;
  created_at: string;
  event_count?: number;
  follower_count?: number;
}

export default function VenueManagementContent() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [venueToDelete, setVenueToDelete] = useState<Venue | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof Venue>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(20);
  
  // Load venues from the database
  const loadVenues = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      // Count total venues for pagination
      const { count } = await supabase
        .from('venues')
        .select('*', { count: 'exact', head: true })
        .ilike('name', `%${searchTerm}%`);
      
      // Calculate total pages
      if (count !== null) {
        setTotalPages(Math.ceil(count / pageSize));
      }
      
      // Fetch venues with pagination and sorting
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .order(sortField, { ascending: sortDirection === 'asc' })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);
      
      if (error) {
        throw error;
      }
      
      // Get counts for each venue separately (more reliable)
      const processedVenues = await Promise.all((data || []).map(async (venue) => {
        // Get event count
        const { count: eventCount } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('venue_id', venue.id);
        
        // Get follower count
        const { count: followerCount } = await supabase
          .from('followed_venues')
          .select('*', { count: 'exact', head: true })
          .eq('venue_id', venue.id);
        
        return {
          ...venue,
          event_count: eventCount || 0,
          follower_count: followerCount || 0
        };
      }));
      
      setVenues(processedVenues);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load venues';
      setError(errorMessage);
      console.error('Error loading venues:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, sortDirection, sortField]);
  
  // Load venues on component mount
  useEffect(() => {
    loadVenues();
  }, [loadVenues]);

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page when searching
    loadVenues();
  };

  // Handle sort change
  const handleSort = (field: keyof Venue) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to ascending for a new field
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle venue deletion
  const handleDeleteVenue = async () => {
      if (!venueToDelete) return;
      
      setIsDeleting(true);
      setDeleteError(null);
      
      try {
        // Use the server action to delete the venue
        await deleteVenueAction(venueToDelete.id, venueToDelete.name);
        
        // Remove the deleted venue from the list
        setVenues(venues.filter(venue => venue.id !== venueToDelete.id));
        setShowDeleteModal(false);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete venue';
        setDeleteError(errorMessage);
        console.error('Error deleting venue:', err);
      } finally {
        setIsDeleting(false);
      }
    };

  // Render sort indicator
  const renderSortIndicator = (field: keyof Venue) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' 
      ? <i className="bi bi-caret-up-fill ms-1"></i>
      : <i className="bi bi-caret-down-fill ms-1"></i>;
  };

  // Format location
  const formatLocation = (venue: Venue) => {
    const parts = [venue.city, venue.state, venue.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Unknown';
  };

  return (
    <div>
      {/* Search and filters */}
      <div className="mb-4">
        <InputGroup>
          <Form.Control
            placeholder="Search venues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button variant="primary" onClick={handleSearch}>
            <i className="bi bi-search me-1"></i>
            Search
          </Button>
        </InputGroup>
      </div>
      
      {/* Error alert */}
      {error && (
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
        </Alert>
      )}
      
      {/* Loading spinner */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading venues...</p>
        </div>
      ) : (
        <>
          {/* Venues table */}
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th 
                  onClick={() => handleSort('name')}
                  style={{ cursor: 'pointer' }}
                >
                  Name {renderSortIndicator('name')}
                </th>
                <th>Location</th>
                <th>Website</th>
                <th 
                  onClick={() => handleSort('event_count')}
                  style={{ cursor: 'pointer' }}
                >
                  Events {renderSortIndicator('event_count')}
                </th>
                <th 
                  onClick={() => handleSort('follower_count')}
                  style={{ cursor: 'pointer' }}
                >
                  Followers {renderSortIndicator('follower_count')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {venues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    No venues found
                  </td>
                </tr>
              ) : (
                venues.map((venue) => (
                  <tr key={venue.id}>
                    <td>{venue.name}</td>
                    <td>{formatLocation(venue)}</td>
                    <td>
                      {venue.url ? (
                        <a href={venue.url} target="_blank" rel="noopener noreferrer" className="text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                          {venue.url}
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>{venue.event_count || 0}</td>
                    <td>{venue.follower_count || 0}</td>
                    <td>
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => {
                          setVenueToDelete(venue);
                          setShowDeleteModal(true);
                        }}
                      >
                        <i className="bi bi-trash me-1"></i>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div>
                <Button
                  variant="outline-secondary"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <i className="bi bi-chevron-left"></i> Previous
                </Button>
              </div>
              <div>
                Page {currentPage} of {totalPages}
              </div>
              <div>
                <Button
                  variant="outline-secondary"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next <i className="bi bi-chevron-right"></i>
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Delete confirmation modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deleteError && (
            <Alert variant="danger" className="mb-3">
              {deleteError}
            </Alert>
          )}
          <p>Are you sure you want to delete the venue <strong>{venueToDelete?.name}</strong>?</p>
          <p className="text-danger">This action will also delete all events and follower relationships for this venue and cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteVenue} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Deleting...
              </>
            ) : (
              <>Delete Venue</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}