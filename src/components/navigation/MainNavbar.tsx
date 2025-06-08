'use client';

import Link from 'next/link';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import navLinks from './nav-links.json';
import 'bootstrap-icons/font/bootstrap-icons.css';

interface NavLink {
  id: string;
  label: string;
  href: string;
  icon?: string;
  auth?: boolean;
}

const MainNavbar = () => {
  // For now, we assume the user is authenticated.
  // We will integrate with Supabase auth later.
  const isAuthenticated = true;

  const filteredNavLinks = navLinks.filter((link: NavLink) => !link.auth || isAuthenticated);

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
            {isAuthenticated ? (
              <NavDropdown title={<><i className="bi bi-person-circle me-2"></i>User</>} id="user-dropdown">
                <NavDropdown.Item as={Link} href="/profile">Profile</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item >Logout</NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Nav.Link as={Link} href="/login">
                <i className="bi bi-box-arrow-in-right me-2"></i>
                Login
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default MainNavbar; 