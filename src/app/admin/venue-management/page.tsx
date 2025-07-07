import { Metadata } from 'next';
import AdminGuard from '@/components/AdminGuard';
import VenueManagementContent from './VenueManagementContent';
import { isAdmin } from '@/utils/auth-helpers';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Venue Management | Concert Aggregator',
  description: 'Manage venues in the concert aggregator system',
};

export default async function VenueManagementPage() {
  // Server-side admin check
  const userIsAdmin = await isAdmin();
  
  // Redirect non-admin users
  if (!userIsAdmin) {
    redirect('/');
  }
  
  return (
    <div className="container py-4">
      <h1 className="mb-4">Venue Management</h1>
      
      {/* Client-side admin guard as a fallback */}
      <AdminGuard>
        <VenueManagementContent />
      </AdminGuard>
    </div>
  );
}