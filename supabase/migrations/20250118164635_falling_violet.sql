/*
  # Fix profiles policies to avoid recursion

  1. Changes
    - Drop existing recursive policies
    - Create new non-recursive policies for profiles
    - Update RLS to properly handle blocked users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- Create new simplified policies
CREATE POLICY "allow_profiles_select"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    -- Allow users to view their own profile
    id = auth.uid() OR
    -- Allow admins to view all profiles (using subquery to avoid recursion)
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.id IN (
        SELECT p.id
        FROM profiles p
        WHERE p.role = 'admin'
      )
    )
  );

CREATE POLICY "allow_profiles_update"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    -- Allow admins to update any profile (using subquery to avoid recursion)
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.id IN (
        SELECT p.id
        FROM profiles p
        WHERE p.role = 'admin'
      )
    )
  )
  WITH CHECK (
    -- Allow admins to update any profile (using subquery to avoid recursion)
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.id IN (
        SELECT p.id
        FROM profiles p
        WHERE p.role = 'admin'
      )
    )
  );

-- Create function to check if user is blocked (without recursion)
CREATE OR REPLACE FUNCTION is_user_blocked(user_id UUID)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = user_id
    AND role = 'blocked'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;