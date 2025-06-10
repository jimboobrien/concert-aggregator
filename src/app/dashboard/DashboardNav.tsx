'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Nav } from 'react-bootstrap';

const DashboardNav = () => {
  const pathname = usePathname();

  return (
    <Nav variant="tabs" defaultActiveKey="/dashboard" className="mb-3">
      <Nav.Item>
        <Nav.Link as={Link} href="/dashboard" active={pathname === '/dashboard'}>
          Test Scraper
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link as={Link} href="/dashboard/import" active={pathname === '/dashboard/import'}>
          Import
        </Nav.Link>
      </Nav.Item>
    </Nav>
  );
};

export default DashboardNav; 