-- Add metrics columns to artists table
ALTER TABLE artists ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS search_count INTEGER DEFAULT 0;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS venue_appearance_count INTEGER DEFAULT 0;

-- Add location columns to venues table
ALTER TABLE venues ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'USA';
ALTER TABLE venues ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS website_domain TEXT;

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

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to create artist metrics" ON artist_metrics;
DROP POLICY IF EXISTS "Allow authenticated users to read artist metrics" ON artist_metrics;

-- Create policy to allow authenticated users to create metrics
CREATE POLICY "Allow authenticated users to create artist metrics" 
ON artist_metrics FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to read metrics
CREATE POLICY "Allow authenticated users to read artist metrics"
ON artist_metrics FOR SELECT USING (auth.role() = 'authenticated'); 