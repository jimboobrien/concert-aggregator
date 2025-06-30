import { Metadata } from 'next';
import AdminGuard from '@/components/AdminGuard';
import ArtistManagementContent from './ArtistManagementContent';
import { isAdmin } from '@/utils/auth-helpers';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Artist Management | Concert Aggregator',
  description: 'Manage artists in the concert aggregator system',
};

export default async function ArtistManagementPage() {
  // Server-side admin check
  const userIsAdmin = await isAdmin();
  
  // Redirect non-admin users
  if (!userIsAdmin) {
    redirect('/');
  }
  
  return (
    <div className="container py-4">
      <h1 className="mb-4">Artist Management</h1>
      
      {/* Client-side admin guard as a fallback */}
      <AdminGuard>
        <ArtistManagementContent />
      </AdminGuard>
    </div>
  );
} 