/*
  # Fix Users Management System

  1. Changes
    - Add indexes for better performance
    - Update RLS policies for better security and role management
*/

-- Add indexes for performance (if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_profiles_role'
  ) THEN
    CREATE INDEX idx_profiles_role ON profiles(role);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_profiles_created_at'
  ) THEN
    CREATE INDEX idx_profiles_created_at ON profiles(created_at);
  END IF;
END $$;

-- Update RLS policies
DROP POLICY IF EXISTS "Allow users to view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create new policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Create update policy that checks role changes
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    (auth.uid() = id) AND (
      (role = 'user'::user_role) OR
      (role = 'admin'::user_role AND 
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND role = 'admin'::user_role
        )
      )
    )
  );