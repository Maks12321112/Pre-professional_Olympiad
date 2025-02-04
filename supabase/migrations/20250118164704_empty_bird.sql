/*
  # Fix profiles policies recursion

  1. Changes
    - Drop existing recursive policies
    - Create new non-recursive policies for profiles
    - Simplify admin role checks to avoid recursion
*/

-- Drop existing policies
DROP POLICY IF EXISTS "allow_profiles_select" ON profiles;
DROP POLICY IF EXISTS "allow_profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- Create new simplified policies
CREATE POLICY "profiles_select_policy"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);  -- Allow all authenticated users to view profiles

CREATE POLICY "profiles_update_policy"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    -- User is updating their own profile or is an admin
    auth.uid() = id OR
    (
      SELECT role FROM profiles WHERE id = auth.uid()
    ) = 'admin'
  )
  WITH CHECK (
    -- User is updating their own profile or is an admin
    auth.uid() = id OR
    (
      SELECT role FROM profiles WHERE id = auth.uid()
    ) = 'admin'
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Update the users view to avoid recursion
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