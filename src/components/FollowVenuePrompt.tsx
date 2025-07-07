'use client';

import React, { useState, useEffect } from 'react';
import { Button, Alert } from 'react-bootstrap';
import { followVenue, unfollowVenue, isFollowingVenue } from '@/actions/follow';

interface FollowVenuePromptProps {
  venueId: string;
  venueName?: string;
}

const FollowVenuePrompt: React.FC<FollowVenuePromptProps> = ({ venueId, venueName = 'Venue' }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (venueId) {
        setLoading(true);
        try {
          const following = await isFollowingVenue(venueId);
          setIsFollowing(following);
        } catch (error) {
          console.error('Error checking venue follow status:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    checkFollowStatus();
  }, [venueId]);

  const handleFollowVenue = async () => {
    if (!venueId) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      const result = await followVenue(venueId);
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setIsFollowing(true);
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

  const handleUnfollowVenue = async () => {
    if (!venueId) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      const result = await unfollowVenue(venueId);
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setIsFollowing(false);
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: `Failed to unfollow venue: ${err instanceof Error ? err.message : 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  if (!venueId) return null;

  return (
    <Alert variant="info" className="mt-4">
      <h5>Track {venueName}</h5>
      {isFollowing ? (
        <div>
          <p>You&apos;re currently following this venue.</p>
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={handleUnfollowVenue}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Unfollow Venue'}
          </Button>
        </div>
      ) : (
        <div>
          <p>Follow this venue to get updates about events.</p>
          <Button 
            variant="outline-primary" 
            size="sm"
            onClick={handleFollowVenue}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Follow Venue'}
          </Button>
        </div>
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