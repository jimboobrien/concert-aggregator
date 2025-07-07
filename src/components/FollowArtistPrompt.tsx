'use client';

import React, { useState, useEffect } from 'react';
import { Button, Alert } from 'react-bootstrap';
import { followArtist, unfollowArtist, isFollowingArtist } from '@/actions/follow';

interface FollowArtistPromptProps {
  artistId?: string;
  artistName?: string;
  compact?: boolean;
}

const FollowArtistPrompt: React.FC<FollowArtistPromptProps> = ({ artistId, artistName, compact = false }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Check if the user is already following this artist when the component mounts
    const checkFollowStatus = async () => {
      if (artistId) {
        try {
          setLoading(true);
          const following = await isFollowingArtist(artistId);
          setIsFollowing(following);
        } catch (error) {
          console.error('Error checking artist follow status:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    checkFollowStatus();
  }, [artistId]);

  const handleFollowArtist = async () => {
    if (!artistId) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      const result = await followArtist(artistId);
      
      if (result.success) {
        setIsFollowing(true);
        setMessage({ type: 'success', text: result.message });
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `Failed to follow artist: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollowArtist = async () => {
    if (!artistId) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      const result = await unfollowArtist(artistId);
      
      if (result.success) {
        setIsFollowing(false);
        setMessage({ type: 'success', text: result.message });
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `Failed to unfollow artist: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  if (!artistId) return null;

  // Compact version for inline use in event lists
  if (compact) {
    return (
      <div className="mt-1">
        <Button 
          variant={isFollowing ? "outline-secondary" : "outline-primary"}
          size="sm"
          onClick={isFollowing ? handleUnfollowArtist : handleFollowArtist}
          disabled={loading}
          className="me-2"
        >
          {loading ? (
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          ) : isFollowing ? (
            <>
              <i className="bi bi-check-circle-fill me-1"></i>
              Following
            </>
          ) : (
            <>
              <i className="bi bi-plus-circle me-1"></i>
              Follow Artist
            </>
          )}
        </Button>
        
        {message && (
          <small className={`text-${message.type === 'success' ? 'success' : 'danger'} ms-2`}>
            {message.text}
          </small>
        )}
      </div>
    );
  }

  // Full version for standalone use
  return (
    <Alert variant="info" className="mt-4">
      <h5>Track {artistName || 'Artist'}</h5>
      {isFollowing ? (
        <div>
          <p>You are currently following this artist.</p>
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={handleUnfollowArtist}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Unfollow Artist'}
          </Button>
        </div>
      ) : (
        <div>
          <p>Follow this artist to get updates about their events.</p>
          <Button 
            variant="outline-primary" 
            size="sm"
            onClick={handleFollowArtist}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Follow Artist'}
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

export default FollowArtistPrompt; 