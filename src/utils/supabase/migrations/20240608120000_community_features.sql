-- Create ENUM types for submission status
CREATE TYPE submission_status AS ENUM ('pending_review', 'approved', 'rejected');
CREATE TYPE venue_status AS ENUM ('active', 'temporarily_closed', 'permanently_closed');

-- Table for submitted artists
CREATE TABLE submitted_artists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    bio TEXT,
    genre TEXT,
    youtube_url TEXT,
    website_url TEXT,
    status submission_status NOT NULL DEFAULT 'pending_review',
    submitted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for submitted_artists
ALTER TABLE submitted_artists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own submitted artists" ON submitted_artists FOR INSERT WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "Users can view their own submitted artists" ON submitted_artists FOR SELECT USING (auth.uid() = submitted_by);

-- Table for submitted venues
CREATE TABLE submitted_venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    city TEXT,
    state TEXT,
    country TEXT,
    website TEXT,
    capacity INT,
    status submission_status NOT NULL DEFAULT 'pending_review',
    submitted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for submitted_venues
ALTER TABLE submitted_venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own submitted venues" ON submitted_venues FOR INSERT WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "Users can view their own submitted venues" ON submitted_venues FOR SELECT USING (auth.uid() = submitted_by);

-- Add new columns to the existing venues table
ALTER TABLE venues
ADD COLUMN status venue_status NOT NULL DEFAULT 'active',
ADD COLUMN holiday_hours JSONB; 