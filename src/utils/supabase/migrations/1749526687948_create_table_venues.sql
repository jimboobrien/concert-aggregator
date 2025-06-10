
-- Migration for creating the venues table
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

-- Policies will be based on crud-config.json
-- Example policies:
-- CREATE POLICY "Allow public read access" ON venues FOR SELECT USING (true);
-- CREATE POLICY "Allow authenticated users to insert" ON venues FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- CREATE POLICY "Allow owners to update" ON venues FOR UPDATE USING (auth.uid() = owner_id);
