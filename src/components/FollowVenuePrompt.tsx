'use client';

import React, { useState, useEffect } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { followVenue, checkIfFollowingVenue } from '@/app/dashboard/actions';

interface FollowVenuePromptProps {
  venueId: string;
  venueName?: string;
}

const FollowVenuePrompt: React.FC<FollowVenuePromptProps> = ({ venueId, venueName = 'Venue' }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingVenue, setFollowingVenue] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (venueId) {
        const following = await checkIfFollowingVenue(venueId);
        setIsFollowing(following);
        setFollowingVenue(!following);
      }
    };
    
    checkFollowStatus();
  }, [venueId]);

  const handleFollowVenue = async () => {
    if (!venueId) return;
    
    setLoading(true);
    
    try {
      const result = await followVenue(venueId);
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setIsFollowing(true);
        setFollowingVenue(false);
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: `Failed to follow venue: ${err instanceof Error ? err.message : 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  if (!venueId) return null;

  return (
    <Alert variant="info" className="mt-4">
      <h5>Track {venueName}</h5>
      <Form.Check 
        type="checkbox"
        id="follow-venue-checkbox"
        label={isFollowing ? `You're already following this venue` : `Add this venue to my followed venues`}
        checked={isFollowing || followingVenue}
        onChange={(e) => setFollowingVenue(e.target.checked)}
        disabled={isFollowing || loading}
      />
      {followingVenue && !isFollowing && (
        <Button 
          variant="outline-primary" 
          size="sm" 
          className="mt-2"
          onClick={handleFollowVenue}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Follow Venue'}
        </Button>
      )}
      
      {message && (
        <Alert 
          variant={message.type === 'success' ? 'success' : 'danger'} 
          className="mt-2 p-2 small"
        >
          {message.text}
        </Alert>
      )}
    </Alert>
  );
};

export default FollowVenuePrompt; 