
-- Migration for creating the artists table
CREATE TABLE artists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;

-- Policies will be based on crud-config.json
-- Example policies:
-- CREATE POLICY "Allow public read access" ON artists FOR SELECT USING (true);
-- CREATE POLICY "Allow authenticated users to insert" ON artists FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- CREATE POLICY "Allow owners to update" ON artists FOR UPDATE USING (auth.uid() = owner_id);
