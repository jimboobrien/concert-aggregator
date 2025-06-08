-- Create Followed Venues Table
CREATE TABLE followed_venues (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (user_id, venue_id)
);

-- Add Indexes for Performance
CREATE INDEX ON followed_venues (user_id);
CREATE INDEX ON followed_venues (venue_id);

-- Add Row Level Security for Followed Venues
ALTER TABLE followed_venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own followed venues." ON followed_venues
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own followed venues." ON followed_venues
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own followed venues." ON followed_venues
  FOR DELETE USING (auth.uid() = user_id); 