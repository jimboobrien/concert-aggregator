'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Nav } from 'react-bootstrap';

// Admin navigation links
const adminNavLinks = [
  {
    id: 'artist-management',
    label: 'Artist Management',
    href: '/admin/artist-management',
    icon: 'bi-people-fill'
  },
  {
    id: 'venue-management',
    label: 'Venue Management',
    href: '/admin/venue-management',
    icon: 'bi-building-fill'
  },
  {
    id: 'user-management',
    label: 'User Management',
    href: '/admin/user-management',
    icon: 'bi-person-badge-fill'
  },
  {
    id: 'dashboard',
    label: 'Back to Dashboard',
    href: '/dashboard',
    icon: 'bi-speedometer2'
  }
];

export default function AdminNav() {
  const pathname = usePathname();
  
  return (
    <div className="sticky-top vh-100 d-flex flex-column bg-dark text-white">
      <div className="p-3 border-bottom border-secondary">
        <h5 className="mb-0">
          <i className="bi bi-shield-lock me-2"></i>
          Admin Panel
        </h5>
      </div>
      
      <Nav className="flex-column p-2">
        {adminNavLinks.map((link) => {
          const isActive = pathname === link.href;
          
          return (
            <Nav.Item key={link.id}>
              <Link
                href={link.href}
                className={`nav-link py-2 px-3 mb-1 ${isActive ? 'active bg-primary rounded text-white' : 'text-white-50'}`}
              >
                <i className={`${link.icon} me-2`}></i>
                {link.label}
              </Link>
            </Nav.Item>
          );
        })}
      </Nav>
      
      <div className="mt-auto p-3 border-top border-secondary">
        <Link href="/" className="nav-link text-white-50">
          <i className="bi bi-house me-2"></i>
          Back to Site
        </Link>
      </div>
    </div>
  );
} 