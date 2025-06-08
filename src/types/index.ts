export interface Venue {
  id: string;
  created_at: string;
  name: string;
  city: string | null;
  state: string | null;
  country: string | null;
  url: string | null;
}

export interface Artist {
  id: string;
  created_at: string;
  name: string;
}

export interface FeedEvent {
  id: string;
  created_at: string;
  artist_id: string;
  venue_id: string;
  event_date: string;
  title: string | null;
  description: string | null;
  url: string | null;
  artist_name: string;
  venue_name: string;
} 