import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin-client';
import { isAdmin } from '@/utils/auth-helpers';

export async function POST(request: Request) {
  try {
    // Check if the current user is an admin
    const userIsAdmin = await isAdmin();
    
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { search, page = 1, pageSize = 20, sortField = 'email', sortDirection = 'asc' } = await request.json();
    
    const supabase = createAdminClient();
    
    // Get users from auth.users table
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: pageSize
    });
    
    if (authError) {
      throw authError;
    }
    
    // Get user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');
    
    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
    }
    
    // Get follow counts for each user
    const userIds = authUsers.users.map(user => user.id);
    
    const { data: artistFollows } = await supabase
      .from('followed_artists')
      .select('user_id')
      .in('user_id', userIds);
    
    const { data: venueFollows } = await supabase
      .from('followed_venues')
      .select('user_id')
      .in('user_id', userIds);
    
    // Create lookup maps
    const roleMap = new Map(userRoles?.map(role => [role.user_id, role.role]) || []);
    const artistFollowCounts = new Map();
    const venueFollowCounts = new Map();
    
    artistFollows?.forEach(follow => {
      const count = artistFollowCounts.get(follow.user_id) || 0;
      artistFollowCounts.set(follow.user_id, count + 1);
    });
    
    venueFollows?.forEach(follow => {
      const count = venueFollowCounts.get(follow.user_id) || 0;
      venueFollowCounts.set(follow.user_id, count + 1);
    });
    
    // Process and format users
    let processedUsers = authUsers.users.map(user => ({
      id: user.id,
      email: user.email || '',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      email_confirmed_at: user.email_confirmed_at,
      role: roleMap.get(user.id) || 'user',
      followed_artists_count: artistFollowCounts.get(user.id) || 0,
      followed_venues_count: venueFollowCounts.get(user.id) || 0
    }));
    
    // Apply search filter
    if (search) {
      processedUsers = processedUsers.filter(user => 
        user.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Apply sorting
    processedUsers.sort((a, b) => {
      const aValue = a[sortField as keyof typeof a];
      const bValue = b[sortField as keyof typeof b];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;
      
      return sortDirection === 'desc' ? -comparison : comparison;
    });
    
    // Calculate pagination
    const totalUsers = processedUsers.length;
    const totalPages = Math.ceil(totalUsers / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedUsers = processedUsers.slice(startIndex, startIndex + pageSize);
    
    return NextResponse.json({
      users: paginatedUsers,
      totalUsers,
      totalPages,
      currentPage: page
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}