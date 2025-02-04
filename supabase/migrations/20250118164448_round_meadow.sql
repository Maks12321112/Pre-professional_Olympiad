/*
  # Fix users page permissions

  1. Changes
    - Drop and recreate users view with proper permissions
    - Update profiles policies to allow admins to view all profiles
*/

-- Drop and recreate the users view with proper permissions
DROP VIEW IF EXISTS users;
CREATE VIEW users AS 
SELECT 
  au.id,
  au.email,
  au.created_at
FROM auth.users au
WHERE 
  -- Only show data to authenticated users who are not blocked
  auth.role() = 'authenticated' AND
  NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'blocked'
  ) AND (
    -- User can see their own data
    au.id = auth.uid() OR
    -- Admins can see all data
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Drop existing profiles policies
DROP POLICY IF EXISTS "allow_select_profiles" ON profiles;
DROP POLICY IF EXISTS "allow_update_profiles" ON profiles;

-- Create new profiles policies
CREATE POLICY "profiles_select_policy"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    -- User is not blocked
    NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'blocked'
    ) AND (
      -- User can view their own profile
      id = auth.uid() OR
      -- Admins can view all profiles
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

CREATE POLICY "profiles_update_policy"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    -- User is not blocked
    NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'blocked'
    ) AND (
      -- Admins can update any profile
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  )
  WITH CHECK (
    -- User is not blocked
    NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'blocked'
    ) AND (
      -- Admins can update any profile
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );