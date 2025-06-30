-- Create venue_scrape_history table to track scraping history
CREATE TABLE IF NOT EXISTS venue_scrape_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    events_count INTEGER DEFAULT 0,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_venue_scrape_history_venue_id ON venue_scrape_history(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_scrape_history_user_id ON venue_scrape_history(user_id);

-- Enable RLS on the venue scrape history table
ALTER TABLE venue_scrape_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to create scrape history records
CREATE POLICY "Allow authenticated users to create venue scrape history" 
ON venue_scrape_history FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to read scrape history
CREATE POLICY "Allow authenticated users to read venue scrape history"
ON venue_scrape_history FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy to allow venue owners to read their venue's scrape history
CREATE POLICY "Allow venue owners to read their venue scrape history"
ON venue_scrape_history FOR SELECT USING (
    auth.uid() IN (
        SELECT user_id FROM profiles WHERE venue_id = venue_scrape_history.venue_id
    )
); 