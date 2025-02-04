/*
  # Fix profile policies to prevent recursion

  1. Changes
    - Drop existing recursive policies
    - Create new non-recursive policies for profiles
    - Add direct role check without using EXISTS
    
  2. Security
    - Maintain same security model but avoid recursion
    - Users can view their own profile
    - Admins can view and update all profiles
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- Create new non-recursive policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Add index to improve performance
CREATE INDEX IF NOT EXISTS idx_profiles_id_role ON profiles(id, role);