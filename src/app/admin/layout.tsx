import { Metadata } from 'next';
import { isAdmin } from '@/utils/auth-helpers';
import { redirect } from 'next/navigation';
import AdminNav from './AdminNav';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Concert Aggregator',
  description: 'Admin dashboard for Concert Aggregator',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side admin check
  const userIsAdmin = await isAdmin();
  
  // Redirect non-admin users
  if (!userIsAdmin) {
    redirect('/');
  }
  
  return (
    <div className="container-fluid">
      <div className="row">
        {/* Admin sidebar */}
        <div className="col-md-3 col-lg-2 p-0 bg-dark">
          <AdminNav />
        </div>
        
        {/* Main content */}
        <div className="col-md-9 col-lg-10 p-4">
          {children}
        </div>
      </div>
    </div>
  );
} 