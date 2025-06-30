-- Migration to create a table for storing scraped URL data
CREATE TABLE IF NOT EXISTS scraped_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  venue_id UUID REFERENCES venues(id),
  last_scraped_at TIMESTAMPTZ DEFAULT now(),
  scrape_count INTEGER DEFAULT 1,
  cached_data JSONB,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '36 hours'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create an index on URL for faster lookups
CREATE INDEX IF NOT EXISTS idx_scraped_urls_url ON scraped_urls(url);

-- Create an index on venue_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_scraped_urls_venue_id ON scraped_urls(venue_id);

-- Enable RLS on the new table
ALTER TABLE scraped_urls ENABLE ROW LEVEL SECURITY;

-- Create a policy for the new table
CREATE POLICY "Allow authenticated users to insert" 
ON scraped_urls 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow users to view scraped URLs" 
ON scraped_urls 
FOR SELECT 
USING (true);

-- Create a function to update the last_scraped_at and scrape_count when a URL is re-scraped
CREATE OR REPLACE FUNCTION update_scraped_url()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_scraped_at = NOW();
  NEW.scrape_count = NEW.scrape_count + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the last_scraped_at and scrape_count when a URL is re-scraped
CREATE TRIGGER update_scraped_url_trigger
BEFORE UPDATE ON scraped_urls
FOR EACH ROW
EXECUTE FUNCTION update_scraped_url(); 