import { createAdminClient } from '@/utils/supabase/admin-client';
import { createClient } from '@/utils/supabase/server';

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
    const supabase = createAdminClient();

    // Check if the user exists
    const { data: user } = await supabase.auth.admin.getUserById(userId);
    if (!user) {
      console.error(`User with ID ${userId} not found`);
      return false;
    }

    // Check if the user already has a role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingRole) {
      // Update the existing role
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating role:', error);
        return false;
      }
    } else {
      // Insert a new role
      const { error } = await supabase
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