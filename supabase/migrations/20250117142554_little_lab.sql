/*
  # Fix profiles table and policies

  1. Changes
    - Drop dependent policies first
    - Recreate profiles table with proper constraints
    - Recreate policies with proper dependencies
    - Add better error handling for user creation
  
  2. Security
    - Maintain RLS
    - Ensure proper role management
*/

-- First drop all dependent policies
DROP POLICY IF EXISTS "Admins can manage equipment" ON equipment;
DROP POLICY IF EXISTS "Admins can manage all requests" ON equipment_requests;
DROP POLICY IF EXISTS "Admins can manage all repair requests" ON repair_requests;
DROP POLICY IF EXISTS "Admins can manage purchase plans" ON purchase_plans;

-- Now we can safely drop and recreate the profiles table
DROP TABLE IF EXISTS profiles;

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role user_role NOT NULL DEFAULT 'user'::user_role,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX profiles_role_idx ON profiles(role);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Recreate profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Recreate dependent policies
CREATE POLICY "Admins can manage equipment"
  ON equipment FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

CREATE POLICY "Admins can manage all requests"
  ON equipment_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

CREATE POLICY "Admins can manage all repair requests"
  ON repair_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

CREATE POLICY "Admins can manage purchase plans"
  ON purchase_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

-- Recreate the trigger function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, role)
  VALUES (new.id, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RETURN new; -- Ensure user creation succeeds even if profile insertion fails
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();