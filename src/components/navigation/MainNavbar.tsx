'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import navLinks from './nav-links.json';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { createClient } from '@/utils/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';

interface NavLink {
  id: string;
  label: string;
  href: string;
  icon?: string;
  auth?: boolean;
  adminOnly?: boolean;
}

interface DecodedToken {
  user_role?: string;
}

const MainNavbar = () => {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const checkUserStatus = useCallback((session: Session | null) => {
    const currentUser = session?.user ?? null;
    setUser(currentUser);
    
    if (session?.access_token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(session.access_token);
        setIsAdmin(decodedToken.user_role === 'admin');
      } catch (e) {
        console.error('Error decoding JWT:', e);
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        checkUserStatus(session);
      }
    );

    // Initial check
    supabase.auth.getUser().then(({ data: { user } }) => {
      checkUserStatus(user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, checkUserStatus]);

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push('/login');
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
                {isAdmin && (
                  <>
                    <NavDropdown.Divider />
                    <NavDropdown.Item as={Link} href="/admin/dashboard">
                      <i className="bi bi-shield-lock me-2"></i>
                      Admin Dashboard
                    </NavDropdown.Item>
                  </>
                )}
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