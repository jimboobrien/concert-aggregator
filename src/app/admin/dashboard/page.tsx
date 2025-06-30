'use client';

import { Card, Row, Col } from 'react-bootstrap';
import Link from 'next/link';

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="mb-4">Admin Dashboard</h1>
      
      <Row>
        <Col md={4} className="mb-4">
          <Card className="h-100">
            <Card.Body>
              <Card.Title>
                <i className="bi bi-people-fill me-2 text-primary"></i>
                Artist Management
              </Card.Title>
              <Card.Text>
                Manage artists in the system. Add, edit, or delete artists.
              </Card.Text>
              <Link href="/admin/artist-management" className="btn btn-primary">
                Manage Artists
              </Link>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-4">
          <Card className="h-100">
            <Card.Body>
              <Card.Title>
                <i className="bi bi-building-fill me-2 text-success"></i>
                Venue Management
              </Card.Title>
              <Card.Text>
                Manage venues in the system. Add, edit, or delete venues.
              </Card.Text>
              <Link href="/admin/venue-management" className="btn btn-success">
                Manage Venues
              </Link>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-4">
          <Card className="h-100">
            <Card.Body>
              <Card.Title>
                <i className="bi bi-person-badge-fill me-2 text-info"></i>
                User Management
              </Card.Title>
              <Card.Text>
                Manage users in the system. Assign roles and permissions.
              </Card.Text>
              <Link href="/admin/user-management" className="btn btn-info">
                Manage Users
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
} 