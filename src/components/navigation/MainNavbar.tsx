'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import navLinks from './nav-links.json';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

interface NavLink {
  id: string;
  label: string;
  href: string;
  icon?: string;
  auth?: boolean;
}

const MainNavbar = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    // Check current auth status
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };
    
    checkUser();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isAuthenticated = !!user;
  const filteredNavLinks = navLinks.filter((link: NavLink) => !link.auth || isAuthenticated);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  };

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
              <NavDropdown title={<><i className="bi bi-person-circle me-2"></i>{user.email}</>} id="user-dropdown">
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