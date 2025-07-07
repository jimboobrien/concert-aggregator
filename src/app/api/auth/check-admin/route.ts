import { NextResponse } from 'next/server';
import { isAdmin } from '@/actions/auth';

/**
 * API route to check if the current user is an admin
 * This provides a way for client components to use the server action
 */
export async function GET() {
  try {
    const isAdminResult = await isAdmin();

    return NextResponse.json({ isAdmin: isAdminResult }, { status: 200 });
  } catch (error) {
    console.error('Error in check-admin API route:', error);
    return NextResponse.json(
      { error: 'Failed to check admin status' },
      { status: 500 }
    );
  }
} 