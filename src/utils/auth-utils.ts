/**
 * Authentication Utilities
 * 
 * This file provides utility functions for common authentication operations.
 * These utilities build on the server actions in src/actions/auth.ts but provide
 * more specific functionality and helper methods for common auth-related tasks.
 */

import { createClient } from './supabase/server';
import { redirect } from 'next/navigation';
import { User } from '@supabase/supabase-js';

/**
 * Gets the current authenticated user
 * @returns The authenticated user or null
 */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  
  if (error || !data?.user) {
    return null;
  }
  
  return data.user;
}

/**
 * Gets the current session
 * @returns The current session or null
 */
export async function getSession() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getSession();
  
  if (error || !data?.session) {
    return null;
  }
  
  return data.session;
}

/**
 * Checks if the user is authenticated
 * @returns Boolean indicating if the user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session;
}

/**
 * Requires authentication, redirects to login if not authenticated
 * @param redirectTo The path to redirect to after login
 * @returns The authenticated user
 */
export async function requireAuthentication(redirectTo?: string) {
  const user = await getUser();
  
  if (!user) {
    const searchParams = new URLSearchParams();
    if (redirectTo) {
      searchParams.set('redirectTo', redirectTo);
    }
    const queryString = searchParams.toString();
    const redirectPath = `/login${queryString ? `?${queryString}` : ''}`;
    
    redirect(redirectPath);
  }
  
  return user;
}

/**
 * Gets the user's profile data
 * @param userId Optional user ID, defaults to current user
 * @returns The user's profile data or null
 */
export async function getUserProfile(userId?: string) {
  const supabase = await createClient();
  
  // If no userId provided, get the current user
  if (!userId) {
    const user = await getUser();
    if (!user) return null;
    userId = user.id;
  }
  
  // Get the profile data
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error || !data) {
    console.error('Error getting user profile:', error);
    return null;
  }
  
  return data;
}

/**
 * Checks if the current user has a specific role
 * @param requiredRole The role to check for
 * @param redirectTo Optional path to redirect to if user doesn't have the role
 * @returns Boolean indicating if the user has the role
 */
export async function checkRole(requiredRole: string, redirectTo?: string): Promise<boolean> {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    if (redirectTo) {
      const searchParams = new URLSearchParams();
      searchParams.set('redirectTo', redirectTo);
      const queryString = searchParams.toString();
      redirect(`/login${queryString ? `?${queryString}` : ''}`);
    }
    return false;
  }
  
  // Check if user has the required role
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  
  if (error || !data) {
    console.error('Error checking user role:', error);
    return false;
  }
  
  const hasRequiredRole = data.role === requiredRole;
  
  // Redirect if user doesn't have the required role
  if (!hasRequiredRole && redirectTo) {
    redirect(redirectTo);
  }
  
  return hasRequiredRole;
}

/**
 * Requires admin role, redirects if not admin
 * @param redirectTo Optional path to redirect to if not admin
 * @returns Boolean indicating if the user is an admin
 */
export async function requireAdmin(redirectTo: string = '/') {
  return checkRole('admin', redirectTo);
}

/**
 * Gets the authentication token from cookies
 * @returns The authentication token or null
 */
export function getAuthToken(): string | null {
  // Access cookies directly from request in server components
  // This is a simplified version - in practice, we should use the Supabase client
  // which handles cookies properly
  try {
    // Use the createClient function which already handles cookies properly
    // This is more reliable than direct cookie access
    return null; // Placeholder - use createClient() for actual auth
  } catch (error) {
    console.error('Error accessing auth token:', error);
    return null;
  }
}

/**
 * Checks if the user's email is verified
 * @returns Boolean indicating if the email is verified
 */
export async function isEmailVerified(): Promise<boolean> {
  const user = await getUser();
  return !!user?.email_confirmed_at;
}

/**
 * Gets user metadata
 * @returns The user's metadata or null
 */
export async function getUserMetadata() {
  const user = await getUser();
  return user?.user_metadata || null;
}

/**
 * Checks if the current user owns a resource
 * @param table The table name
 * @param resourceId The resource ID
 * @param userIdField The field name for the user ID in the table
 * @returns Boolean indicating if the user owns the resource
 */
export async function isResourceOwner(
  table: string,
  resourceId: string,
  userIdField: string = 'user_id'
): Promise<boolean> {
  const user = await getUser();
  if (!user) return false;
  
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(table)
    .select(userIdField)
    .eq('id', resourceId)
    .single();
  
  if (error || !data) {
    console.error(`Error checking resource ownership in ${table}:`, error);
    return false;
  }
  
  // Use type assertion to access the property safely
  return data[userIdField as keyof typeof data] === user.id;
}

/**
 * Requires ownership of a resource, redirects if not owner
 * @param table The table name
 * @param resourceId The resource ID
 * @param userIdField The field name for the user ID in the table
 * @param redirectTo Path to redirect to if not owner
 * @returns Boolean indicating if the user owns the resource
 */
export async function requireResourceOwnership(
  table: string,
  resourceId: string,
  userIdField: string = 'user_id',
  redirectTo: string = '/'
): Promise<boolean> {
  const isOwner = await isResourceOwner(table, resourceId, userIdField);
  
  if (!isOwner) {
    redirect(redirectTo);
  }
  
  return true;
} 