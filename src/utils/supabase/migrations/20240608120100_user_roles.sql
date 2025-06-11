-- Create a table for user roles
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    CONSTRAINT user_roles_user_id_key UNIQUE (user_id)
);

-- Enable RLS for user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage roles
-- Note: This policy assumes you have a way to identify admins,
-- for now, we'll allow users to see their own role.
-- A more robust solution would involve a function to check for an admin role.
CREATE POLICY "Allow users to see their own role" ON user_roles
FOR SELECT USING (auth.uid() = user_id);

-- We will need a secure way to assign admin roles, which will be handled
-- by a database function or direct database access by a superuser.
-- For now, an admin user would need to be created manually in the database. 