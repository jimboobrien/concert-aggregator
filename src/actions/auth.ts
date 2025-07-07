'use server';

/**
 * Authentication Server Actions
 * 
 * This file centralizes all authentication-related server actions for the application.
 * These actions handle user authentication, role management, and profile updates.
 * 
 * By using Server Actions, we ensure cookie handling is done correctly within the
 * Next.js App Router framework and avoid errors related to cookie modification in Server Components.
 */

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin-client';

/**
 * Email validation regex pattern
 * This validates that the email follows standard format: username@domain.tld
 */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Password validation regex pattern
 * Requires at least 8 characters, one uppercase letter, one lowercase letter, and one number
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * Validates an email address
 * @param email Email to validate
 * @returns True if email is valid, false otherwise
 */
function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Checks if password meets strength requirements
 * @param password Password to validate
 * @returns Object containing validity status and any error messages
 */
function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!PASSWORD_REGEX.test(password)) {
    return { 
      valid: false, 
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
    };
  }
  
  return { valid: true };
}

/**
 * Handles user login with email and password
 * @param formData Form data containing email and password
 * @returns Redirects to account page or login page with error message
 */
export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Field presence validation
  if (!email || !password) {
    return redirect('/login?message=Email and password are required');
  }

  // Email format validation
  if (!isValidEmail(email)) {
    return redirect('/login?message=Please enter a valid email address');
  }

  // Trim inputs to prevent whitespace issues
  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();

  try {
    const supabase = await createClient();
    
    const { error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: trimmedPassword,
    });

    if (error) {
      console.error('Login error:', error.message);
      
      // Provide user-friendly error messages
      if (error.message.includes('credentials')) {
        return redirect(`/login?message=${encodeURIComponent('Invalid email or password')}`);
      } else if (error.message.includes('rate limited')) {
        return redirect(`/login?message=${encodeURIComponent('Too many login attempts. Please try again later')}`);
      }
      
      return redirect(`/login?message=${encodeURIComponent(error.message || 'Could not authenticate user')}`);
    }

    // Upon successful login, revalidate relevant pages
    revalidatePath('/', 'layout');

    // Check if there's a redirectTo query param
    const url = new URL(formData.get('redirectTo')?.toString() || '/account', 'http://localhost');
    const redirectTo = url.pathname + url.search;
    
    // Redirect to the intended destination
    return redirect(redirectTo);
  } catch (err) {
    console.error('Unexpected login error:', err);
    return redirect('/login?message=An unexpected error occurred during login');
  }
}

/**
 * Handles new user signup with email and password
 * @param formData Form data containing email and password
 * @returns Redirects to login page with success or error message
 */
export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string || password;

  // Field presence validation
  if (!email || !password) {
    return redirect('/login?message=Email and password are required');
  }

  // Email format validation
  if (!isValidEmail(email)) {
    return redirect('/login?message=Please enter a valid email address');
  }
  
  // Password match validation
  if (password !== confirmPassword) {
    return redirect('/login?message=Passwords do not match');
  }

  // Password strength validation
  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    return redirect(`/login?message=${encodeURIComponent(passwordCheck.message || 'Invalid password')}`);
  }

  try {
    const supabase = await createClient();
    
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      console.error('Signup error:', error.message);
      
      // Provide user-friendly error messages
      if (error.message.includes('already')) {
        return redirect(`/login?message=${encodeURIComponent('An account with this email already exists')}`);
      }
      
      return redirect(`/login?message=${encodeURIComponent(error.message || 'Could not create user')}`);
    }

    // Upon successful signup, revalidate relevant pages
    revalidatePath('/', 'layout');

    // Redirect to login page with success message
    return redirect('/login?message=Check email to continue sign in process');
  } catch (err) {
    console.error('Unexpected signup error:', err);
    return redirect('/login?message=An unexpected error occurred during signup');
  }
}

/**
 * Initiates password reset process by sending an email with a reset link
 * @param formData Form data containing the user's email
 * @returns Redirects to forgot-password page with success or error message
 */
export async function requestPasswordReset(formData: FormData) {
  const email = formData.get('email') as string;
  
  // Basic validation
  if (!email) {
    return redirect('/forgot-password?message=Email is required');
  }

  // Email format validation
  if (!isValidEmail(email)) {
    return redirect('/forgot-password?message=Please enter a valid email address');
  }

  try {
    const supabase = await createClient();

    // Configure redirect URL for the password reset flow
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/update-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      
      // Rate limiting error handling
      if (error.message.includes('rate limited')) {
        return redirect(`/forgot-password?message=${encodeURIComponent('Too many requests. Please try again later.')}`);
      }
      
      return redirect(`/forgot-password?message=${encodeURIComponent('Error: Could not send password reset email. Please try again.')}`);
    }

    // Intentionally using the same message regardless of whether the email exists
    // This prevents user enumeration attacks
    return redirect('/forgot-password?message=If an account exists for this email, a password reset link has been sent.');
  } catch (err) {
    console.error('Unexpected error in password reset:', err);
    return redirect('/forgot-password?message=An unexpected error occurred. Please try again.');
  }
}

/**
 * Updates the user's password after reset
 * @param formData Form data containing the new password and confirmation
 * @returns Redirects to login page with success message or update-password page with error
 */
export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  
  // Basic validation
  if (!password || !confirmPassword) {
    return redirect('/update-password?message=Please fill in both password fields');
  }

  // Password match validation
  if (password !== confirmPassword) {
    return redirect('/update-password?message=Error: Passwords do not match.');
  }

  // Password strength validation
  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    return redirect(`/update-password?message=${encodeURIComponent(passwordCheck.message || 'Password does not meet security requirements')}`);
  }

  try {
    const supabase = await createClient();
    
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error('Error updating password:', error);
      
      // Handle specific error cases
      if (error.message.includes('rate limited')) {
        return redirect('/update-password?message=Too many requests. Please try again later.');
      } else if (error.message.includes('session')) {
        return redirect('/login?message=Your session has expired. Please sign in again before updating your password.');
      }
      
      return redirect(`/update-password?message=${encodeURIComponent('Error: Could not update password. Please try again.')}`);
    }

    // Revalidate paths to ensure fresh data after password change
    revalidatePath('/', 'layout');

    // Sign out the user to enforce re-authentication with new password
    await supabase.auth.signOut();
    
    // Redirect to login page with success message
    return redirect('/login?message=Your password has been updated successfully. Please sign in again.');
  } catch (err) {
    console.error('Unexpected error updating password:', err);
    return redirect('/update-password?message=An unexpected error occurred. Please try again.');
  }
}

/**
 * Logs the user out and redirects to the login page
 * @param formData Optional form data, can include a redirectTo parameter
 * @returns Redirects to login page or specified page
 */
export async function logout(formData?: FormData) {
  try {
    const supabase = await createClient();
    
    // Sign out the user
    await supabase.auth.signOut();
    
    // Revalidate all authenticated pages
    revalidatePath('/', 'layout');
    
    // Check for a redirect URL in the form data
    let redirectTo = '/login';
    if (formData) {
      const redirectParam = formData.get('redirectTo')?.toString();
      if (redirectParam) {
        // Ensure the redirect URL is relative for security
        const url = new URL(redirectParam, 'http://localhost');
        redirectTo = url.pathname + url.search;
      }
    }

    // Redirect to login page or specified page
    return redirect(redirectTo);
  } catch (err) {
    console.error('Error during logout:', err);
    // Even if there's an error, redirect to login page
    return redirect('/login?message=Error during logout. You have been signed out.');
  }
}

/**
 * API route compatible logout function
 * For use in API routes that need to perform a logout
 * @returns Response object with redirect
 */
export async function logoutApi(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  
  // Get origin from request
  const { origin } = new URL(request.url);
  
  // Create response with redirect
  return new Response(null, {
    status: 302,
    headers: {
      'Location': `${origin}/login`
    }
  });
}

/**
 * Helper function to get the current authenticated user
 * @returns The currently authenticated user or null
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  
  if (error || !data?.user) {
    return null;
  }
  
  return data.user;
}

/**
 * Helper function to require authentication
 * If user is not authenticated, redirects to login page
 * @param redirectTo Optional path to redirect to after login
 * @returns The authenticated user
 */
export async function requireAuth(redirectTo?: string) {
  const user = await getCurrentUser();
  
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
 * Check if the current user has admin role
 * @returns Boolean indicating if the user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  try {
    // This function should only be called in server components or server actions
    if (typeof window !== 'undefined') {
      console.warn('isAdmin should only be called in server components or server actions');
      return false;
    }

    // Get the supabase client using cookies
    const supabase = await createClient();

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check if user has admin role
    const { data: role } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    return role?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Check if the current user has a specific role
 * @param role The role to check for
 * @returns Boolean indicating if the user has the specified role
 */
export async function hasRole(role: string): Promise<boolean> {
  try {
    // This function should only be called in server components or server actions
    if (typeof window !== 'undefined') {
      console.warn('hasRole should only be called in server components or server actions');
      return false;
    }

    // Get the supabase client using cookies
    const supabase = await createClient();

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check if user has the specified role
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    return userRole?.role === role;
  } catch (error) {
    console.error(`Error checking role ${role}:`, error);
    return false;
  }
}

/**
 * Assign a role to a user (admin only)
 * @param userId The ID of the user to assign the role to
 * @param role The role to assign
 * @returns Boolean indicating if the role was successfully assigned
 */
export async function assignRole(userId: string, role: string): Promise<boolean> {
  try {
    // This function should only be called in server actions
    if (typeof window !== 'undefined') {
      console.warn('assignRole should only be called in server actions');
      return false;
    }

    // Check if the current user is an admin
    if (!await isAdmin()) {
      console.error('Only admins can assign roles');
      return false;
    }

    // Get the admin supabase client
    const adminClient = createAdminClient();

    // Check if the user exists
    const { data: user } = await adminClient.auth.admin.getUserById(userId);
    if (!user) {
      console.error(`User with ID ${userId} not found`);
      return false;
    }

    // Check if the user already has a role
    const { data: existingRole } = await adminClient
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingRole) {
      // Update the existing role
      const { error } = await adminClient
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating role:', error);
        return false;
      }
    } else {
      // Insert a new role
      const { error } = await adminClient
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) {
        console.error('Error inserting role:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error assigning role:', error);
    return false;
  }
}

/**
 * Update a user's profile information
 * @param formData Form data containing profile information
 * @returns Redirects to profile page with success or error message
 */
export async function updateProfile(formData: FormData) {
  try {
    // Get the current user
    const user = await requireAuth('/login');
    
    // Extract form data
    const fullName = formData.get('fullName') as string;
    const username = formData.get('username') as string;
    const hometown = formData.get('hometown') as string;
    const avatarUrl = formData.get('avatarUrl') as string || null;
    
    // Validation
    const validationErrors = [];
    
    // Username validation
    if (username) {
      if (username.length < 3) {
        validationErrors.push('Username must be at least 3 characters long');
      }
      
      if (username.length > 30) {
        validationErrors.push('Username cannot exceed 30 characters');
      }
      
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        validationErrors.push('Username can only contain letters, numbers, and underscores');
      }
    }
    
    // Full name validation
    if (fullName && fullName.length > 100) {
      validationErrors.push('Full name cannot exceed 100 characters');
    }
    
    // Hometown validation
    if (hometown && hometown.length > 100) {
      validationErrors.push('Hometown cannot exceed 100 characters');
    }
    
    // Avatar URL validation
    if (avatarUrl && typeof avatarUrl === 'string') {
      const isValidUrl = (() => {
        try {
          new URL(avatarUrl);
          return true;
        } catch {
          return false;
        }
      })();
      
      if (!isValidUrl) {
        validationErrors.push('Invalid avatar URL format');
      }
    }
    
    if (validationErrors.length > 0) {
      const errorMessage = validationErrors.join(', ');
      return redirect(`/profile?error=${encodeURIComponent(errorMessage)}`);
    }
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Prepare update data - only include provided fields
    const updates: {
      full_name?: string;
      username?: string;
      hometown?: string;
      avatar_url?: string | null;
      updated_at: string;
    } = {
      updated_at: new Date().toISOString(),
    };
    
    if (fullName !== undefined) updates.full_name = fullName.trim();
    if (username !== undefined) updates.username = username.trim();
    if (hometown !== undefined) updates.hometown = hometown.trim();
    if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;
    
    // Update the profile
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
    
    if (error) {
      console.error('Error updating profile:', error);
      
      // Handle unique username constraint error
      if (error.code === '23505' && error.message.includes('username')) {
        return redirect('/profile?error=Username already taken');
      }
      
      return redirect('/profile?error=Error updating profile');
    }
    
    // Revalidate profile page to reflect changes
    revalidatePath('/profile');
    revalidatePath('/account');
    
    // Redirect to profile page with success message
    return redirect('/profile?message=Profile updated successfully');
  } catch (error) {
    console.error('Unexpected error updating profile:', error);
    return redirect('/profile?error=An unexpected error occurred');
  }
} 