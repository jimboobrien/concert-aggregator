'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Alert, Spinner } from 'react-bootstrap';

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * A component that only renders its children if the user is an admin
 */
export default function AdminGuard({ children, fallback }: AdminGuardProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const supabase = createClient();
        
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          throw new Error(`Authentication error: ${userError.message}`);
        }
        
        if (!user) {
          setIsAdmin(false);
          return;
        }

        // Check if user has admin role
        const { data: role, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (roleError && roleError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.warn('Error checking admin role:', roleError);
        }

        setIsAdmin(role?.role === 'admin' || false);
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