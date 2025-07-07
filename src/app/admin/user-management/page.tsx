import { Metadata } from 'next';
import AdminGuard from '@/components/AdminGuard';
import UserManagementContent from './UserManagementContent';
import { isAdmin } from '@/utils/auth-helpers';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'User Management | Concert Aggregator',
  description: 'Manage users and admin roles in the concert aggregator system',
};

export default async function UserManagementPage() {
  // Server-side admin check
  const userIsAdmin = await isAdmin();
  
  // Redirect non-admin users
  if (!userIsAdmin) {
    redirect('/');
  }
  
  return (
    <div className="container py-4">
      <h1 className="mb-4">User Management</h1>
      
      {/* Client-side admin guard as a fallback */}
      <AdminGuard>
        <UserManagementContent />
      </AdminGuard>
    </div>
  );
}