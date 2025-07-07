'use client';

import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Form, InputGroup, Modal, Alert, Spinner, Badge } from 'react-bootstrap';
import { createClient } from '@/utils/supabase/client';
import { promoteUserToAdmin, removeAdminRole } from './actions';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  role?: string;
  followed_artists_count?: number;
  followed_venues_count?: number;
}

export default function UserManagementContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [userToUpdate, setUserToUpdate] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof User>('email');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(20);
  
  // Load users from the database
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      // Get users from auth.users via admin client through API
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          search: searchTerm,
          page: currentPage,
          pageSize: pageSize,
          sortField: sortField,
          sortDirection: sortDirection
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load users';
      setError(errorMessage);
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, sortDirection, sortField]);
  
  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page when searching
    loadUsers();
  };

  // Handle sort change
  const handleSort = (field: keyof User) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to ascending for a new field
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle role update
  const handleUpdateRole = async (isPromoting: boolean) => {
    if (!userToUpdate) return;
    
    setIsUpdating(true);
    setUpdateError(null);
    
    try {
      if (isPromoting) {
        await promoteUserToAdmin(userToUpdate.id, userToUpdate.email);
      } else {
        await removeAdminRole(userToUpdate.id, userToUpdate.email);
      }
      
      // Reload users to reflect changes
      await loadUsers();
      setShowRoleModal(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user role';
      setUpdateError(errorMessage);
      console.error('Error updating user role:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Render sort indicator
  const renderSortIndicator = (field: keyof User) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' 
      ? <i className="bi bi-caret-up-fill ms-1"></i>
      : <i className="bi bi-caret-down-fill ms-1"></i>;
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div>
      {/* Search and filters */}
      <div className="mb-4">
        <InputGroup>
          <Form.Control
            placeholder="Search users by email..."
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
          <p className="mt-2">Loading users...</p>
        </div>
      ) : (
        <>
          {/* Users table */}
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th 
                  onClick={() => handleSort('email')}
                  style={{ cursor: 'pointer' }}
                >
                  Email {renderSortIndicator('email')}
                </th>
                <th>Role</th>
                <th>Email Verified</th>
                <th 
                  onClick={() => handleSort('created_at')}
                  style={{ cursor: 'pointer' }}
                >
                  Created {renderSortIndicator('created_at')}
                </th>
                <th 
                  onClick={() => handleSort('last_sign_in_at')}
                  style={{ cursor: 'pointer' }}
                >
                  Last Login {renderSortIndicator('last_sign_in_at')}
                </th>
                <th>Following</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>
                      {user.role === 'admin' ? (
                        <Badge bg="danger">Admin</Badge>
                      ) : (
                        <Badge bg="secondary">User</Badge>
                      )}
                    </td>
                    <td>
                      {user.email_confirmed_at ? (
                        <Badge bg="success">Verified</Badge>
                      ) : (
                        <Badge bg="warning">Pending</Badge>
                      )}
                    </td>
                    <td>{formatDate(user.created_at)}</td>
                    <td>{formatDate(user.last_sign_in_at)}</td>
                    <td>
                      <small>
                        {user.followed_artists_count || 0} artists<br/>
                        {user.followed_venues_count || 0} venues
                      </small>
                    </td>
                    <td>
                      {user.role === 'admin' ? (
                        <Button 
                          variant="outline-warning" 
                          size="sm"
                          onClick={() => {
                            setUserToUpdate(user);
                            setShowRoleModal(true);
                          }}
                        >
                          <i className="bi bi-shield-slash me-1"></i>
                          Remove Admin
                        </Button>
                      ) : (
                        <Button 
                          variant="outline-success" 
                          size="sm"
                          onClick={() => {
                            setUserToUpdate(user);
                            setShowRoleModal(true);
                          }}
                        >
                          <i className="bi bi-shield-check me-1"></i>
                          Make Admin
                        </Button>
                      )}
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
      
      {/* Role update confirmation modal */}
      <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update User Role</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {updateError && (
            <Alert variant="danger" className="mb-3">
              {updateError}
            </Alert>
          )}
          {userToUpdate && (
            <>
              <p>
                Are you sure you want to {userToUpdate.role === 'admin' ? 'remove admin privileges from' : 'grant admin privileges to'}{' '}
                <strong>{userToUpdate.email}</strong>?
              </p>
              {userToUpdate.role !== 'admin' && (
                <p className="text-warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  This will give the user full administrative access to the system.
                </p>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRoleModal(false)} disabled={isUpdating}>
            Cancel
          </Button>
          <Button 
            variant={userToUpdate?.role === 'admin' ? 'warning' : 'success'} 
            onClick={() => handleUpdateRole(userToUpdate?.role !== 'admin')} 
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Updating...
              </>
            ) : (
              <>
                {userToUpdate?.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}