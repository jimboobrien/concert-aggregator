import { redirect } from 'next/navigation';

export default function AdminIndexPage() {
  // Redirect to the admin dashboard
  redirect('/admin/dashboard');
} 