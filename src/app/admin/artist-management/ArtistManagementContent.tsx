'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Form, InputGroup, Modal, Alert, Spinner } from 'react-bootstrap';
import { createClient } from '@/utils/supabase/client';

interface Artist {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  view_count?: number;
  search_count?: number;
  venue_appearance_count?: number;
}

export default function ArtistManagementContent() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [artistToDelete, setArtistToDelete] = useState<Artist | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof Artist>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(20);
  
  // Load artists on component mount
  useEffect(() => {
    loadArtists();
  }, [currentPage, sortField, sortDirection]);

  // Load artists from the database
  const loadArtists = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      // Count total artists for pagination
      const { count } = await supabase
        .from('artists')
        .select('*', { count: 'exact', head: true })
        .ilike('name', `%${searchTerm}%`);
      
      // Calculate total pages
      if (count !== null) {
        setTotalPages(Math.ceil(count / pageSize));
      }
      
      // Fetch artists with pagination and sorting
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .order(sortField, { ascending: sortDirection === 'asc' })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);
      
      if (error) {
        throw error;
      }
      
      setArtists(data || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load artists';
      setError(errorMessage);
      console.error('Error loading artists:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page when searching
    loadArtists();
  };

  // Handle sort change
  const handleSort = (field: keyof Artist) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to ascending for a new field
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle artist deletion
    // Handle artist deletion
    const handleDeleteArtist = async () => {
        if (!artistToDelete) return;
        
        setIsDeleting(true);
        setDeleteError(null);
        
        try {
          const supabase = createClient();
          // Call the RPC function to delete the artist and get follower IDs
          const { data: formerFollowers, error } = await supabase.rpc(
            'delete_artist_and_related_data',
            { artist_id_to_delete: artistToDelete.id }
          );
          
          if (error) {
            throw error;
          }
          
          // If there were followers, call the API to handle re-following.
          // We don't need to wait for this to finish, it can run in the background.
          if (formerFollowers && formerFollowers.length > 0) {
            fetch('/api/artists/handle-deleted-followers', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                deletedArtistName: artistToDelete.name,
                followerIds: formerFollowers.map(f => f.user_id),
              }),
            });
          }
    
          // Remove the deleted artist from the list
          setArtists(artists.filter(artist => artist.id !== artistToDelete.id));
          setShowDeleteModal(false);
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to delete artist';
          setDeleteError(errorMessage);
          console.error('Error deleting artist:', err);
        } finally {
          setIsDeleting(false);
        }
      };

  // Render sort indicator
  const renderSortIndicator = (field: keyof Artist) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' 
      ? <i className="bi bi-caret-up-fill ms-1"></i>
      : <i className="bi bi-caret-down-fill ms-1"></i>;
  };

  return (
    <div>
      {/* Search and filters */}
      <div className="mb-4">
        <InputGroup>
          <Form.Control
            placeholder="Search artists..."
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
          <p className="mt-2">Loading artists...</p>
        </div>
      ) : (
        <>
          {/* Artists table */}
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th 
                  onClick={() => handleSort('name')}
                  style={{ cursor: 'pointer' }}
                >
                  Name {renderSortIndicator('name')}
                </th>
                <th 
                  onClick={() => handleSort('view_count')}
                  style={{ cursor: 'pointer' }}
                >
                  Views {renderSortIndicator('view_count')}
                </th>
                <th 
                  onClick={() => handleSort('search_count')}
                  style={{ cursor: 'pointer' }}
                >
                  Searches {renderSortIndicator('search_count')}
                </th>
                <th 
                  onClick={() => handleSort('venue_appearance_count')}
                  style={{ cursor: 'pointer' }}
                >
                  Venue Appearances {renderSortIndicator('venue_appearance_count')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {artists.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4">
                    No artists found
                  </td>
                </tr>
              ) : (
                artists.map((artist) => (
                  <tr key={artist.id}>
                    <td>{artist.name}</td>
                    <td>{artist.view_count || 0}</td>
                    <td>{artist.search_count || 0}</td>
                    <td>{artist.venue_appearance_count || 0}</td>
                    <td>
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => {
                          setArtistToDelete(artist);
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
          <p>Are you sure you want to delete the artist <strong>{artistToDelete?.name}</strong>?</p>
          <p className="text-danger">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteArtist} disabled={isDeleting}>
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
              <>Delete Artist</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
} 