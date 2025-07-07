'use server';

import { createAdminClient } from '@/utils/supabase/admin-client';
import { isAdmin } from '@/utils/auth-helpers';
import { revalidatePath } from 'next/cache';

export async function promoteUserToAdmin(userId: string, userEmail: string) {
  // Check if the current user is an admin
  const userIsAdmin = await isAdmin();
  
  if (!userIsAdmin) {
    throw new Error('Unauthorized: Only admins can promote users to admin');
  }

  try {
    const supabase = createAdminClient();
    
    // Check if the user exists
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !user) {
      throw new Error(`User not found: ${userEmail}`);
    }
    
    // Check if the user already has a role
    const { data: existingRole, error: roleCheckError } = await supabase
      .from('user_roles')
      .select('id, role')
      .eq('user_id', userId)
      .single();
    
    if (roleCheckError && roleCheckError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is fine
      throw new Error('Error checking existing user role');
    }
    
    if (existingRole) {
      if (existingRole.role === 'admin') {
        return { success: true, message: 'User is already an admin' };
      }
      
      // Update existing role to admin
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({ role: 'admin' })
        .eq('user_id', userId);
      
      if (updateError) {
        throw updateError;
      }
    } else {
      // Insert new admin role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });
      
      if (insertError) {
        throw insertError;
      }
    }
    
    // Revalidate the user management page
    revalidatePath('/admin/user-management');
    
    return { success: true, message: `${userEmail} has been promoted to admin` };
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    throw error;
  }
}

export async function removeAdminRole(userId: string, userEmail: string) {
  // Check if the current user is an admin
  const userIsAdmin = await isAdmin();
  
  if (!userIsAdmin) {
    throw new Error('Unauthorized: Only admins can remove admin roles');
  }

  try {
    const supabase = createAdminClient();
    
    // Check if the user exists
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !user) {
      throw new Error(`User not found: ${userEmail}`);
    }
    
    // Get current user to prevent self-demotion
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser?.id === userId) {
      throw new Error('You cannot remove your own admin privileges');
    }
    
    // Check if the user has an admin role
    const { data: existingRole, error: roleCheckError } = await supabase
      .from('user_roles')
      .select('id, role')
      .eq('user_id', userId)
      .single();
    
    if (roleCheckError || !existingRole) {
      return { success: true, message: 'User is not an admin' };
    }
    
    if (existingRole.role !== 'admin') {
      return { success: true, message: 'User is not an admin' };
    }
    
    // Remove the admin role (delete the record to revert to default user role)
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);
    
    if (deleteError) {
      throw deleteError;
    }
    
    // Revalidate the user management page
    revalidatePath('/admin/user-management');
    
    return { success: true, message: `Admin privileges removed from ${userEmail}` };
  } catch (error) {
    console.error('Error removing admin role:', error);
    throw error;
  }
}