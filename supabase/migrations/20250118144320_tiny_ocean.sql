-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create new simplified policies
CREATE POLICY "profiles_select_policy" 
  ON profiles FOR SELECT 
  TO authenticated 
  USING (true);  -- Allow all authenticated users to view profiles

CREATE POLICY "profiles_update_policy" 
  ON profiles FOR UPDATE 
  TO authenticated 
  USING (
    CASE
      -- User is updating their own profile
      WHEN auth.uid() = id THEN true
      -- User is an admin (check JWT claim directly)
      WHEN auth.jwt()->>'role' = 'authenticated' AND 
           EXISTS (
             SELECT 1 
             FROM auth.users 
             WHERE auth.users.id = auth.uid() 
             AND id IN (SELECT id FROM profiles WHERE role = 'admin')
           ) THEN true
      ELSE false
    END
  )
  WITH CHECK (
    CASE
      -- User is updating their own profile
      WHEN auth.uid() = id THEN true
      -- User is an admin (check JWT claim directly)
      WHEN auth.jwt()->>'role' = 'authenticated' AND 
           EXISTS (
             SELECT 1 
             FROM auth.users 
             WHERE auth.users.id = auth.uid() 
             AND id IN (SELECT id FROM profiles WHERE role = 'admin')
           ) THEN true
      ELSE false
    END
  );

-- Add index for id and role combination if it doesn't exist
DROP INDEX IF EXISTS idx_profiles_id_role;
CREATE INDEX IF NOT EXISTS idx_profiles_id_role ON profiles(id, role);

-- Update users view to use the same pattern
DROP VIEW IF EXISTS users;
CREATE VIEW users AS 
SELECT 
  au.id,
  au.email,
  au.created_at
FROM auth.users au;

-- Grant access to the authenticated users
GRANT SELECT ON users TO authenticated;