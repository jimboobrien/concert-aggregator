
-- Migration for creating the submitted_venues table
CREATE TABLE submitted_venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE submitted_venues ENABLE ROW LEVEL SECURITY;

-- Policies will be based on crud-config.json
-- Example policies:
-- CREATE POLICY "Allow public read access" ON submitted_venues FOR SELECT USING (true);
-- CREATE POLICY "Allow authenticated users to insert" ON submitted_venues FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- CREATE POLICY "Allow owners to update" ON submitted_venues FOR UPDATE USING (auth.uid() = owner_id);
