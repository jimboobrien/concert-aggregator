'use client';

import { useEffect, useState } from 'react';
import { Alert, Spinner } from 'react-bootstrap';

// Create a client wrapper for the server action
async function checkIsAdmin() {
  // We need to make a fetch call to use the server action from a client component
  const response = await fetch('/api/auth/check-admin');
  if (!response.ok) {
    throw new Error('Failed to check admin status');
  }
  const data = await response.json();
  return data.isAdmin;
}

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * A component that only renders its children if the user is an admin
 * Uses the centralized admin check server action
 */
export default function AdminGuard({ children, fallback }: AdminGuardProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const isAdminResult = await checkIsAdmin();
        setIsAdmin(isAdminResult);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setError(error instanceof Error ? error.message : 'Failed to check admin status');
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center p-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="warning">
        <Alert.Heading>Authentication Error</Alert.Heading>
        <p>{error}</p>
        <p>Please try refreshing the page or logging in again.</p>
      </Alert>
    );
  }

  if (!isAdmin) {
    return fallback || (
      <Alert variant="danger">
        <Alert.Heading>Access Denied</Alert.Heading>
        <p>You do not have permission to access this page. This area is restricted to administrators only.</p>
      </Alert>
    );
  }

  return <>{children}</>;
} 