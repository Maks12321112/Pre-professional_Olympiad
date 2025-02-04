-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- Create new simplified policies with unique names
CREATE POLICY "allow_select_profiles" 
  ON profiles FOR SELECT 
  TO authenticated 
  USING (true);  -- Allow all authenticated users to view profiles

CREATE POLICY "allow_update_profiles" 
  ON profiles FOR UPDATE 
  TO authenticated 
  USING (
    -- User is updating their own profile or is an admin
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    -- User is updating their own profile or is an admin
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add index for id and role combination if it doesn't exist
DROP INDEX IF EXISTS idx_profiles_id_role;
CREATE INDEX IF NOT EXISTS idx_profiles_id_role ON profiles(id, role);

-- Recreate the users view with proper permissions
DROP VIEW IF EXISTS users;
CREATE VIEW users AS 
SELECT 
  au.id,
  au.email,
  au.created_at
FROM auth.users au
WHERE 
  -- Only show data to authenticated users
  auth.role() = 'authenticated' AND (
    -- User can see their own data
    au.id = auth.uid() OR
    -- Admins can see all data
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Grant access to the authenticated users
GRANT SELECT ON users TO authenticated;