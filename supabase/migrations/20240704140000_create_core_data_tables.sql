-- Create Venues Table
CREATE TABLE venues (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  country TEXT,
  url TEXT,
  PRIMARY KEY (id)
);

-- Add Row Level Security for Venues
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venues are viewable by everyone." ON venues
  FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can create venues." ON venues
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update and delete venues." ON venues
  FOR ALL USING (auth.role() = 'service_role');


-- Create Artists Table
CREATE TABLE artists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  name TEXT NOT NULL,
  genre TEXT,
  spotify_id TEXT UNIQUE,
  image_url TEXT,
  PRIMARY KEY (id)
);

-- Add Row Level Security for Artists
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists are viewable by everyone." ON artists
  FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can create artists." ON artists
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update and delete artists." ON artists
  FOR ALL USING (auth.role() = 'service_role'); 