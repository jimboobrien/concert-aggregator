-- Migration to add URL and metrics fields to the venues table
ALTER TABLE venues ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS website_domain TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS scrape_count INTEGER DEFAULT 0;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMPTZ;

-- Create an index on website_domain for faster lookups
CREATE INDEX IF NOT EXISTS idx_venues_website_domain ON venues(website_domain);

-- Create a function to extract domain from URL
CREATE OR REPLACE FUNCTION extract_domain(url TEXT)
RETURNS TEXT AS $$
DECLARE
  domain TEXT;
BEGIN
  -- Extract domain from URL (remove protocol and path)
  domain := regexp_replace(url, '^https?://(?:www\.)?([^/]+).*$', '\1', 'i');
  RETURN domain;
END;
$$ LANGUAGE plpgsql;

-- Create a function to increment scrape count
CREATE OR REPLACE FUNCTION increment_venue_scrape_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE venues
  SET 
    scrape_count = scrape_count + 1,
    last_scraped_at = NOW()
  WHERE id = NEW.venue_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a table to track scraping history
CREATE TABLE IF NOT EXISTS venue_scrape_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id),
  scraped_at TIMESTAMPTZ DEFAULT now(),
  url TEXT,
  events_count INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id)
);

-- Enable RLS on the new table
ALTER TABLE venue_scrape_history ENABLE ROW LEVEL SECURITY;

-- Create a policy for the new table
CREATE POLICY "Allow authenticated users to insert" 
ON venue_scrape_history 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow users to view their own scrape history" 
ON venue_scrape_history 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a trigger to increment venue scrape count when a new scrape history entry is added
CREATE TRIGGER increment_scrape_count
AFTER INSERT ON venue_scrape_history
FOR EACH ROW
EXECUTE FUNCTION increment_venue_scrape_count();

-- Add metrics columns to artists table
ALTER TABLE artists ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS search_count INTEGER DEFAULT 0;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS venue_appearance_count INTEGER DEFAULT 0;

-- Create artist_metrics table to store more detailed metrics
CREATE TABLE IF NOT EXISTS artist_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL,
    value INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_artist_metrics_artist_id ON artist_metrics(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_metrics_type ON artist_metrics(metric_type);

-- Create function to increment artist metrics
CREATE OR REPLACE FUNCTION increment_artist_metric(
    artist_id_param UUID,
    metric_type_param TEXT,
    increment_value INTEGER DEFAULT 1,
    metadata_param JSONB DEFAULT '{}'::jsonb
) RETURNS VOID AS $$
BEGIN
    -- Insert a record into the metrics table
    INSERT INTO artist_metrics (artist_id, metric_type, value, metadata)
    VALUES (artist_id_param, metric_type_param, increment_value, metadata_param);
    
    -- Update the summary column in the artists table
    CASE metric_type_param
        WHEN 'view' THEN
            UPDATE artists SET view_count = view_count + increment_value 
            WHERE id = artist_id_param;
        WHEN 'search' THEN
            UPDATE artists SET search_count = search_count + increment_value 
            WHERE id = artist_id_param;
        WHEN 'venue_appearance' THEN
            UPDATE artists SET venue_appearance_count = venue_appearance_count + increment_value 
            WHERE id = artist_id_param;
        ELSE
            -- Do nothing for unknown metric types
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on the metrics table
ALTER TABLE artist_metrics ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to create metrics
CREATE POLICY "Allow authenticated users to create artist metrics" 
ON artist_metrics FOR INSERT TO authenticated USING (true);

-- Create policy to allow authenticated users to read metrics
CREATE POLICY "Allow authenticated users to read artist metrics"
ON artist_metrics FOR SELECT TO authenticated USING (true); 