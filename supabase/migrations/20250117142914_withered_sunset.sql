/*
  # Fix profiles table RLS policies

  1. Changes
    - Drop existing profiles policies
    - Create new, more permissive policies for profiles table
    - Add policy for users to insert their own profile
  
  2. Security
    - Allow authenticated users to view profiles
    - Allow users to create their own profile
    - Allow users to update their own profile
*/

-- Drop existing policies on profiles
DROP POLICY IF EXISTS "Allow users to view profiles" ON profiles;
DROP POLICY IF EXISTS "Only admins can modify profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create new policies
CREATE POLICY "Allow users to view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    CASE 
      WHEN role = 'admin'::user_role THEN 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'::user_role)
      ELSE auth.uid() = id
    END
  );