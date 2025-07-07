'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import navLinks from './nav-links.json';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { createClient } from '@/utils/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface NavLink {
  id: string;
  label: string;
  href: string;
  icon?: string;
  auth?: boolean;
  adminOnly?: boolean;
}


const MainNavbar = () => {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const checkUserStatus = useCallback(async (session: Session | null) => {
    const currentUser = session?.user ?? null;
    setUser(currentUser);
    
    if (currentUser) {
      // Check admin status using the database
      try {
        const { data: role } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', currentUser.id)
          .single();
        
        setIsAdmin(role?.role === 'admin');
      } catch (e) {
        console.error('Error checking admin status:', e);
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
    
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        checkUserStatus(session);
      }
    );

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkUserStatus(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, checkUserStatus]);

  const handleLogout = async () => {
    try {
      setLoading(true);
      
      // Use server-side logout API endpoint
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.redirected) {
        // Follow the redirect from the server
        window.location.href = response.url;
      } else {
        // Fallback to client-side navigation
        router.push('/login');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      
      // If server-side logout fails, try client-side logout as fallback
      await supabase.auth.signOut();
      router.push('/login');
    }
  };

  const isAuthenticated = !!user;
  const filteredNavLinks = navLinks.filter((link: NavLink) => {
    if (link.auth && !isAuthenticated) return false;
    if (link.adminOnly && !isAdmin) return false;
    return true;
  });

  return (
    <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
      <Container>
        <Navbar.Brand as={Link} href="/">
          <i className="bi-music-note-beamed me-2"></i>
          Concert Aggregator
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar-nav" />
        <Navbar.Collapse id="main-navbar-nav">
          <Nav className="me-auto">
            {filteredNavLinks.map((link) => (
              <Nav.Link key={link.id} as={Link} href={link.href}>
                {link.icon && <i className={`bi ${link.icon} me-2`}></i>}
                {link.label}
              </Nav.Link>
            ))}
            {isAdmin && (
              <NavDropdown
                title={
                  <>
                    <i className="bi bi-gear-fill me-2"></i>
                    Admin
                  </>
                }
                id="admin-dropdown"
              >
                <NavDropdown.Item as={Link} href="/admin/dashboard">
                  <i className="bi bi-speedometer2 me-2"></i>
                  Admin Dashboard
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item as={Link} href="/admin/artist-management">
                  <i className="bi bi-people-fill me-2"></i>
                  Artist Management
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} href="/admin/venue-management">
                  <i className="bi bi-building-fill me-2"></i>
                  Venue Management
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} href="/admin/user-management">
                  <i className="bi bi-people me-2"></i>
                  User Management
                </NavDropdown.Item>
              </NavDropdown>
            )}
          </Nav>
          <Nav>
            {loading ? (
              <Nav.Item>
                <span className="nav-link">
                  <i className="bi bi-hourglass me-2"></i>Loading...
                </span>
              </Nav.Item>
            ) : isAuthenticated ? (
              <NavDropdown 
                title={<><i className="bi bi-person-circle me-2"></i>{user.email || 'User'}</>} 
                id="user-dropdown"
              >
                <NavDropdown.Item as={Link} href="/profile">Profile</NavDropdown.Item>
                <NavDropdown.Item as={Link} href="/account">Account</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Nav.Link as={Link} href="/login" className="me-2">
                  <i className="bi bi-box-arrow-in-right me-1"></i>
                  Login
                </Nav.Link>
                <Nav.Item className="d-flex align-items-center">
                  <Link href="/login?signup=true" className="btn btn-outline-light btn-sm">
                    Sign Up
                  </Link>
                </Nav.Item>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default MainNavbar; 